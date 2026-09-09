import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateOrderDto } from "./dto/order.dto";
import { OrderStatus, PaymentStatus, StockAdjustmentReason } from "@prisma/client";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Order items cannot be empty");
    }

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemPayloads: Array<{
        productId: string;
        variantId: string;
        productName: string;
        size: string;
        color: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
      }> = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new BadRequestException(
            `Product with ID ${item.productId} is unavailable`,
          );
        }

        // Resolve variant
        let variant = null;
        if (item.variantId) {
          variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
        } else {
          variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: item.size,
              color: item.color,
            },
          });
        }

        if (!variant) {
          throw new BadRequestException(
            `Variant (${item.color} / ${item.size}) for ${product.name} not found`,
          );
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Item '${product.name}' (${variant.size}/${variant.color}) has insufficient stock. Available: ${variant.stock}`,
          );
        }

        const unitPrice = Number(product.price);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemPayloads.push({
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          size: variant.size,
          color: variant.color,
          unitPrice,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });

        // Deduct stock
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        // Create inventory log
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            changeQty: -item.quantity,
            newStock: variant.stock - item.quantity,
            reason: StockAdjustmentReason.CUSTOMER_ORDER,
            createdById: userId || null,
          },
        });
      }

      // Calculate Shipping Fee
      const isInsideDhaka =
        dto.shippingAddress.division.trim().toLowerCase() === "dhaka";
      const shippingFee = isInsideDhaka ? 80 : 150;

      // Handle Coupon Code
      let discountAmount = 0;
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: dto.couponCode.trim().toUpperCase() },
        });

        if (
          coupon &&
          coupon.isActive &&
          new Date() >= coupon.startDate &&
          new Date() <= coupon.expiryDate &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          subtotal >= Number(coupon.minSpend)
        ) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
            if (
              coupon.maxDiscount &&
              discountAmount > Number(coupon.maxDiscount)
            ) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else {
            discountAmount = Number(coupon.discountValue);
          }

          if (discountAmount > subtotal) discountAmount = subtotal;

          // Increment usage count
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      const totalAmount = subtotal + shippingFee - discountAmount;

      // Generate Order Number
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `DRP-${randomSuffix}`;

      // Calculate Estimated Delivery Date (3 days)
      const estimatedDelivery = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      );

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          customerName: dto.customer.fullName,
          customerEmail: dto.customer.email || "",
          customerPhone: dto.customer.phone,
          shippingAddress: dto.shippingAddress as any,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod || "COD",
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          couponCode: dto.couponCode || null,
          estimatedDelivery,
          items: {
            create: orderItemPayloads.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              size: i.size,
              color: i.color,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              totalPrice: i.totalPrice,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note: "Order received",
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),
        estimatedDelivery: order.estimatedDelivery,
        itemsCount: order.items.length,
      };
    });
  }

  async trackOrder(identifier: string) {
    const cleanId = identifier.trim();

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [{ orderNumber: cleanId }, { customerPhone: cleanId }],
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      throw new NotFoundException(
        `No orders found matching '${identifier}'`,
      );
    }

    const primaryOrder = orders[0];

    return {
      orderNumber: primaryOrder.orderNumber,
      status: primaryOrder.status,
      paymentStatus: primaryOrder.paymentStatus,
      paymentMethod: primaryOrder.paymentMethod,
      courierProvider: primaryOrder.courierProvider || "Steadfast Courier",
      trackingNumber: primaryOrder.trackingNumber || `STDF-${primaryOrder.orderNumber.replace("DRP-", "")}`,
      customerName: primaryOrder.customerName,
      customerPhone: primaryOrder.customerPhone,
      subtotal: Number(primaryOrder.subtotal),
      shippingFee: Number(primaryOrder.shippingFee),
      discountAmount: Number(primaryOrder.discountAmount),
      totalAmount: Number(primaryOrder.totalAmount),
      estimatedDelivery: primaryOrder.estimatedDelivery,
      items: primaryOrder.items,
      timeline: primaryOrder.statusHistory.map((h) => ({
        status: h.status,
        timestamp: h.createdAt,
        note: h.note,
      })),
    };
  }

  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      items: o.items,
    }));
  }
}

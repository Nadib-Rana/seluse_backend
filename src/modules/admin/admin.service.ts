import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateOrderStatusDto, AdjustStockDto } from "./dto/admin.dto";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllOrders(status?: OrderStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shippingFee),
        discountAmount: Number(o.discountAmount),
        totalAmount: Number(o.totalAmount),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, adminId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status,
          ...(dto.courierProvider ? { courierProvider: dto.courierProvider } : {}),
          ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: dto.status,
          note: dto.note || `Order status updated to ${dto.status}`,
        },
      });

      if (adminId) {
        await tx.auditLog.create({
          data: {
            adminId,
            action: "UPDATE_ORDER_STATUS",
            target: "Order",
            targetId: orderId,
            payload: dto as any,
          },
        });
      }

      return updatedOrder;
    });

    return {
      orderNumber: updated.orderNumber,
      status: updated.status,
      courierProvider: updated.courierProvider,
      trackingNumber: updated.trackingNumber,
    };
  }

  async adjustStock(dto: AdjustStockDto, adminId?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant not found`);
    }

    const newStock = variant.stock + dto.changeQty;
    if (newStock < 0) {
      throw new BadRequestException(`Cannot adjust stock below 0. Current: ${variant.stock}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: dto.variantId },
        data: { stock: newStock },
      });

      const log = await tx.inventoryLog.create({
        data: {
          variantId: dto.variantId,
          changeQty: dto.changeQty,
          newStock,
          reason: dto.reason,
          referenceId: dto.referenceId || null,
          createdById: adminId || null,
        },
      });

      return {
        variantId: updatedVariant.id,
        sku: updatedVariant.sku,
        newStock: updatedVariant.stock,
        logId: log.id,
      };
    });
  }

  async getInventoryLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            include: { product: true },
          },
        },
      }),
      this.prisma.inventoryLog.count(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { admin: true },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReportsSummary() {
    const [totalOrders, pendingOrders, completedOrders, aggregateRevenue, totalProducts, totalCustomers] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: "PAID" },
        }),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: Number(aggregateRevenue._sum.totalAmount || 0),
      totalProducts,
      totalCustomers,
    };
  }
}

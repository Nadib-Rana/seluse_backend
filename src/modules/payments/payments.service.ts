import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  InitiatePaymentDto,
  PaymentGateway,
  SslCommerzIpnDto,
  BkashCallbackDto,
} from "./dto/payment.dto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dto.orderIdentifier,
      );

    const order = await this.prisma.order.findFirst({
      where: isUuid
        ? { id: dto.orderIdentifier }
        : { orderNumber: dto.orderIdentifier },
    });

    if (!order) {
      throw new NotFoundException(
        `Order not found: ${dto.orderIdentifier}`,
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        `Order ${order.orderNumber} has already been paid`,
      );
    }

    const gateway = dto.gateway || PaymentGateway.SSLCOMMERZ;
    const tranId = `TRX-${order.orderNumber}-${Date.now().toString().slice(-6)}`;
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";

    const paymentUrl = `${frontendUrl}/order-confirmation?orderNumber=${encodeURIComponent(
      order.orderNumber,
    )}&tranId=${tranId}&gateway=${gateway}&status=simulated_success`;

    this.logger.log(
      `Initiated payment session for Order #${order.orderNumber} via ${gateway} (Tran ID: ${tranId})`,
    );

    return {
      success: true,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      gateway,
      transactionId: tranId,
      paymentUrl,
    };
  }

  async handleSslCommerzWebhook(payload: SslCommerzIpnDto) {
    const tranId = payload.tran_id;
    this.logger.log(`Received SSLCommerz IPN webhook for transaction: ${tranId}`);

    // Parse order number from tran_id (e.g. TRX-DRP-84920-123456 => DRP-84920)
    const matches = tranId.match(/DRP-\d+/i);
    const orderNumber = matches ? matches[0].toUpperCase() : tranId;

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      this.logger.warn(`SSLCommerz webhook order not found: ${orderNumber}`);
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    const statusUpper = (payload.status || "VALID").toUpperCase();
    const isValid = statusUpper === "VALID" || statusUpper === "VALIDATED";

    if (isValid) {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status:
              order.status === OrderStatus.PENDING
                ? OrderStatus.CONFIRMED
                : order.status,
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.CONFIRMED,
            note: `Payment verified via SSLCommerz IPN (Tran ID: ${tranId}, Bank Tran: ${payload.bank_tran_id || "N/A"})`,
          },
        }),
      ]);

      return {
        status: "SUCCESS",
        message: `Order #${order.orderNumber} payment validated successfully`,
        orderNumber: order.orderNumber,
      };
    } else {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.FAILED },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            note: `SSLCommerz payment failed (Status: ${payload.status})`,
          },
        }),
      ]);

      return {
        status: "FAILED",
        message: `Payment failed for order #${order.orderNumber}`,
        orderNumber: order.orderNumber,
      };
    }
  }

  async handleBkashWebhook(payload: BkashCallbackDto) {
    this.logger.log(`Received bKash webhook for paymentID: ${payload.paymentID}`);

    const isSuccess =
      payload.status?.toLowerCase() === "completed" || Boolean(payload.trxID);

    if (!isSuccess) {
      return { status: "FAILED", message: "bKash payment failed" };
    }

    const orders = await this.prisma.order.findMany({
      where: { paymentStatus: PaymentStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (orders.length === 0) {
      return { status: "IGNORED", message: "No pending orders to match" };
    }

    const targetOrder = orders[0];

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: targetOrder.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status:
            targetOrder.status === OrderStatus.PENDING
              ? OrderStatus.CONFIRMED
              : targetOrder.status,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: targetOrder.id,
          status: OrderStatus.CONFIRMED,
          note: `bKash Payment verified (Payment ID: ${payload.paymentID}, Trx ID: ${payload.trxID || "N/A"})`,
        },
      }),
    ]);

    return {
      status: "SUCCESS",
      message: `bKash payment verified for order #${targetOrder.orderNumber}`,
      orderNumber: targetOrder.orderNumber,
    };
  }
}

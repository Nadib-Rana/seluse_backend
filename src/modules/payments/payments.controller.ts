import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import {
  InitiatePaymentDto,
  SslCommerzIpnDto,
  BkashCallbackDto,
} from "./dto/payment.dto";
import { Public } from "../../common/decorators/public.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Payments & Webhooks")
@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post("initiate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Initiate payment gateway session for an order" })
  @ResponseMessage("Payment gateway session initiated successfully.")
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Public()
  @Post("webhook/sslcommerz")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "SSLCommerz IPN webhook listener" })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  @ResponseMessage("SSLCommerz IPN webhook processed.")
  async sslCommerzWebhook(@Body() dto: SslCommerzIpnDto) {
    return this.paymentsService.handleSslCommerzWebhook(dto);
  }

  @Public()
  @Post("webhook/bkash")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "bKash IPN callback webhook listener" })
  @ApiResponse({ status: 200, description: "bKash webhook processed" })
  @ResponseMessage("bKash webhook processed.")
  async bkashWebhook(@Body() dto: BkashCallbackDto) {
    return this.paymentsService.handleBkashWebhook(dto);
  }
}

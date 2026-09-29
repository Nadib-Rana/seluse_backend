import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsEnum } from "class-validator";

export enum PaymentGateway {
  SSLCOMMERZ = "SSLCOMMERZ",
  BKASH = "BKASH",
  NAGAD = "NAGAD",
  CARD = "CARD",
}

export class InitiatePaymentDto {
  @ApiProperty({ example: "DRP-84920", description: "Order number or order UUID" })
  @IsNotEmpty()
  @IsString()
  orderIdentifier: string;

  @ApiPropertyOptional({ enum: PaymentGateway, default: PaymentGateway.SSLCOMMERZ })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @ApiPropertyOptional({ example: "http://localhost:5173/order-confirmation" })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ example: "http://localhost:5173/checkout" })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class SslCommerzIpnDto {
  @ApiProperty({ example: "DRP-84920" })
  @IsNotEmpty()
  @IsString()
  tran_id: string;

  @ApiPropertyOptional({ example: "VALID" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "260928123456" })
  @IsOptional()
  @IsString()
  val_id?: string;

  @ApiPropertyOptional({ example: "1890.00" })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ example: "VISA-DBBL" })
  @IsOptional()
  @IsString()
  card_type?: string;

  @ApiPropertyOptional({ example: "BANK-998877" })
  @IsOptional()
  @IsString()
  bank_tran_id?: string;

  @ApiPropertyOptional({ example: "BDT" })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class BkashCallbackDto {
  @ApiProperty({ example: "TRX99887766" })
  @IsNotEmpty()
  @IsString()
  paymentID: string;

  @ApiPropertyOptional({ example: "Completed" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "9K8J7H6G5F" })
  @IsOptional()
  @IsString()
  trxID?: string;

  @ApiPropertyOptional({ example: "1890.00" })
  @IsOptional()
  @IsString()
  amount?: string;
}

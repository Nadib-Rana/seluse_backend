import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { OrderStatus, StockAdjustmentReason } from "@prisma/client";
import { Type } from "class-transformer";

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ example: "Steadfast" })
  @IsOptional()
  @IsString()
  courierProvider?: string;

  @ApiPropertyOptional({ example: "STDF-994012" })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: "Handed over to courier" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdjustStockDto {
  @ApiProperty({ example: "v1-uuid" })
  @IsNotEmpty()
  @IsString()
  variantId: string;

  @ApiProperty({ example: 10, description: "Positive to restock, negative to deduct" })
  @Type(() => Number)
  @IsInt()
  changeQty: number;

  @ApiProperty({ enum: StockAdjustmentReason, example: StockAdjustmentReason.RESTOCK })
  @IsEnum(StockAdjustmentReason)
  reason: StockAdjustmentReason;

  @ApiPropertyOptional({ example: "PO-8849" })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

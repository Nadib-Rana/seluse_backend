import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class ValidateCouponDto {
  @ApiProperty({ example: "WINTER10" })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 2500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class CreateCouponDto {
  @ApiProperty({ example: "SUMMER20" })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: "PERCENTAGE", enum: ["PERCENTAGE", "FIXED"] })
  @IsNotEmpty()
  @IsString()
  discountType: "PERCENTAGE" | "FIXED";

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSpend?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: "2026-09-01T00:00:00Z" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: "2026-09-30T23:59:59Z" })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

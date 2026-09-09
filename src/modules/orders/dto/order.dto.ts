import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "@prisma/client";

export class CustomerDetailsDto {
  @ApiProperty({ example: "Nadib Rana" })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: "nadib@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: "+8801700000000" })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class ShippingAddressDto {
  @ApiProperty({ example: "Nadib Rana" })
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiProperty({ example: "+8801700000000" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: "Dhaka" })
  @IsNotEmpty()
  @IsString()
  division: string;

  @ApiProperty({ example: "Dhaka" })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ example: "Gulshan 2" })
  @IsNotEmpty()
  @IsString()
  area: string;

  @ApiProperty({ example: "House 14, Road 5" })
  @IsNotEmpty()
  @IsString()
  addressLine: string;
}

export class OrderItemInputDto {
  @ApiProperty({ example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: "v1" })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ example: "M" })
  @IsNotEmpty()
  @IsString()
  size: string;

  @ApiProperty({ example: "Navy" })
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: CustomerDetailsDto })
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customer: CustomerDetailsDto;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: "WINTER10" })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

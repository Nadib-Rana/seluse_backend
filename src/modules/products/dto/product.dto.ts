import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class ProductQueryDto {
  @ApiPropertyOptional({ example: "men" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: "Shirts" })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ example: "Essentials" })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiPropertyOptional({ example: "sale" })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional({ example: "M,L,XL" })
  @IsOptional()
  @IsString()
  sizes?: string;

  @ApiPropertyOptional({ example: "Navy,Black" })
  @IsOptional()
  @IsString()
  colors?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ example: "featured", enum: ["featured", "newest", "price-asc", "price-desc", "rating"] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: "linen shirt" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 12;
}

export class CreateVariantDto {
  @ApiProperty({ example: "MSH-OXF-001-WHITE-M" })
  @IsString()
  sku: string;

  @ApiProperty({ example: "M" })
  @IsString()
  size: string;

  @ApiProperty({ example: "White" })
  @IsString()
  color: string;

  @ApiProperty({ example: "#FFFFFF" })
  @IsString()
  colorHex: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  stock: number;
}

export class CreateProductDto {
  @ApiProperty({ example: "Oxford Slim Fit Shirt" })
  @IsString()
  name: string;

  @ApiProperty({ example: "oxford-slim-fit-shirt" })
  @IsString()
  slug: string;

  @ApiProperty({ example: "MSH-OXF-001" })
  @IsString()
  sku: string;

  @ApiProperty({ example: "men" })
  @IsString()
  categorySlug: string;

  @ApiProperty({ example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: "Shirts" })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ example: "Essentials" })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiProperty({ example: "Slim fit Oxford shirt..." })
  @IsString()
  description: string;

  @ApiProperty({ example: 1890 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 2490 })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiPropertyOptional({ example: "Sale" })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ example: ["https://images.unsplash.com/photo-1"] })
  @IsArray()
  images: string[];

  @ApiPropertyOptional({ example: { material: "100% Cotton" } })
  @IsOptional()
  features?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  variants?: CreateVariantDto[];
}

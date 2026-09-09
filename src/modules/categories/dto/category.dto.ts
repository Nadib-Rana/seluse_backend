import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateCategoryDto {
  @ApiProperty({ example: "Men" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: "men" })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: "Men's apparel and accessories" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "https://cdn.drape.com/banners/men.jpg" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "Men" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "men" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Men's apparel and accessories" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "https://cdn.drape.com/banners/men.jpg" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

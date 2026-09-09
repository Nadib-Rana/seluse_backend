import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateCampaignDto {
  @ApiProperty({ example: "Summer Collection 2026" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: "summer-collection-2026" })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: "Discover fresh warm weather essentials" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "https://images.unsplash.com/photo-1523381210434" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPct?: number;

  @ApiProperty({ example: "2026-05-01T00:00:00Z" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: "2026-09-30T23:59:59Z" })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

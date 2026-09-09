import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ValidateCouponDto, CreateCouponDto } from "./dto/coupon.dto";

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(dto: ValidateCouponDto) {
    const codeClean = dto.code.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: codeClean },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Invalid or inactive coupon code");
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.expiryDate) {
      throw new BadRequestException("Coupon is expired or not yet active");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Coupon usage limit reached");
    }

    const subtotal = Number(dto.subtotal);
    if (coupon.minSpend && subtotal < Number(coupon.minSpend)) {
      throw new BadRequestException(
        `Minimum spend of ৳${coupon.minSpend} required for this coupon`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateCouponDto) {
    const codeClean = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({
      where: { code: codeClean },
    });

    if (existing) {
      throw new ConflictException(`Coupon code ${codeClean} already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code: codeClean,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minSpend: dto.minSpend || 0,
        maxDiscount: dto.maxDiscount || null,
        usageLimit: dto.usageLimit || null,
        startDate: new Date(dto.startDate),
        expiryDate: new Date(dto.expiryDate),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException("Coupon not found");
    }

    return this.prisma.coupon.delete({ where: { id } });
  }
}

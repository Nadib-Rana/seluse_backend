import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { ValidateCouponDto, CreateCouponDto } from "./dto/coupon.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Coupons & Discounts")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Post("coupons/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate coupon code for current cart/subtotal" })
  @ResponseMessage("Coupon validated successfully")
  async validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Get("admin/coupons")
  @ApiOperation({ summary: "List all coupons (Admin)" })
  @ResponseMessage("Coupons loaded")
  async findAll() {
    return this.couponsService.findAll();
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post("admin/coupons")
  @ApiOperation({ summary: "Create coupon code (Admin)" })
  @ResponseMessage("Coupon created successfully")
  async create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete("admin/coupons/:id")
  @ApiOperation({ summary: "Delete coupon code (Admin)" })
  @ResponseMessage("Coupon deleted successfully")
  async remove(@Param("id") id: string) {
    return this.couponsService.remove(id);
  }
}

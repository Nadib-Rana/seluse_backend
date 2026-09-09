import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/order.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Checkout & Order Lifecycle")
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Place new order (Guest or Member Checkout)" })
  @ResponseMessage("Order placed successfully.")
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user?.id || undefined;
    return this.ordersService.createOrder(dto, userId);
  }

  @Public()
  @Get("track/:identifier")
  @ApiOperation({ summary: "Track order details by order number or phone number" })
  @ResponseMessage("Order status retrieved.")
  async trackOrder(@Param("identifier") identifier: string) {
    return this.ordersService.trackOrder(identifier);
  }

  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @Get("my-orders")
  @ApiOperation({ summary: "Get order history for authenticated customer" })
  @ResponseMessage("Customer order history loaded.")
  async getMyOrders(@CurrentUser("id") userId: string) {
    return this.ordersService.findMyOrders(userId);
  }
}

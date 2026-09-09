import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { UpdateOrderStatusDto, AdjustStockDto } from "./dto/admin.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { OrderStatus, Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Admin & Management Controls")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN, Role.CUSTOMER_SERVICE)
  @Get("orders")
  @ApiOperation({ summary: "Get all customer orders with filters (Admin / CSR)" })
  @ResponseMessage("Orders loaded")
  async findAllOrders(
    @Query("status") status?: OrderStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.adminService.findAllOrders(status, Number(page), Number(limit));
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN, Role.CUSTOMER_SERVICE)
  @Patch("orders/:id/status")
  @ApiOperation({ summary: "Update order status & add tracking (Admin / CSR)" })
  @ResponseMessage("Order status updated successfully")
  async updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminService.updateOrderStatus(id, dto, adminId);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @Post("inventory/adjust")
  @ApiOperation({ summary: "Adjust product variant stock (Admin)" })
  @ResponseMessage("Stock adjusted successfully")
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminService.adjustStock(dto, adminId);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @Get("inventory/logs")
  @ApiOperation({ summary: "Get stock adjustment inventory logs (Admin)" })
  @ResponseMessage("Inventory logs loaded")
  async getInventoryLogs(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.adminService.getInventoryLogs(Number(page), Number(limit));
  }

  @Roles(Role.SUPER_ADMIN)
  @Get("audit-logs")
  @ApiOperation({ summary: "Get administrative audit logs (Super Admin)" })
  @ResponseMessage("Audit logs loaded")
  async getAuditLogs(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.adminService.getAuditLogs(Number(page), Number(limit));
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @Get("reports/summary")
  @ApiOperation({ summary: "Get store analytics and financial reporting summary" })
  @ResponseMessage("Reporting summary loaded")
  async getReportsSummary() {
    return this.adminService.getReportsSummary();
  }
}

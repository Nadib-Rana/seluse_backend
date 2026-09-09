import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { ProductQueryDto, CreateProductDto } from "./dto/product.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Products & Catalog")
@Controller("products")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get catalog products with filtering, search, and pagination" })
  @ResponseMessage("Products retrieved successfully.")
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(":idOrSlug")
  @ApiOperation({ summary: "Get product details by ID or Slug" })
  @ResponseMessage("Product details loaded.")
  async findOne(@Param("idOrSlug") idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create new product (Admin)" })
  @ResponseMessage("Product created successfully")
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Deactivate product (Admin)" })
  @ResponseMessage("Product deactivated successfully")
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}

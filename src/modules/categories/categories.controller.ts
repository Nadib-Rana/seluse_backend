import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Categories")
@Controller("categories")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all active categories with subcategories" })
  @ResponseMessage("Categories loaded successfully")
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get category details by slug" })
  @ResponseMessage("Category details loaded successfully")
  async findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create new category (Admin)" })
  @ResponseMessage("Category created successfully")
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Put(":id")
  @ApiOperation({ summary: "Update category (Admin)" })
  @ResponseMessage("Category updated successfully")
  async update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Deactivate category (Admin)" })
  @ResponseMessage("Category deactivated successfully")
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/campaign.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Promotional Campaigns")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get("campaigns")
  @ApiOperation({ summary: "Get all active promotional campaigns" })
  @ResponseMessage("Campaigns loaded")
  async findAllActive() {
    return this.campaignsService.findAllActive();
  }

  @Public()
  @Get("campaigns/:slug")
  @ApiOperation({ summary: "Get campaign details by slug" })
  @ResponseMessage("Campaign details loaded")
  async findBySlug(@Param("slug") slug: string) {
    return this.campaignsService.findBySlug(slug);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Get("admin/campaigns")
  @ApiOperation({ summary: "List all campaigns (Admin)" })
  @ResponseMessage("Campaigns loaded (Admin)")
  async findAllAdmin() {
    return this.campaignsService.findAllAdmin();
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post("admin/campaigns")
  @ApiOperation({ summary: "Create marketing campaign (Admin)" })
  @ResponseMessage("Campaign created successfully")
  async create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Roles(Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete("admin/campaigns/:id")
  @ApiOperation({ summary: "Delete marketing campaign (Admin)" })
  @ResponseMessage("Campaign deleted successfully")
  async remove(@Param("id") id: string) {
    return this.campaignsService.remove(id);
  }
}

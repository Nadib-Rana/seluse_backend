import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WishlistService } from "./wishlist.service";
import { AddToWishlistDto } from "./dto/wishlist.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "@prisma/client";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Wishlist")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER, Role.SUPER_ADMIN, Role.STORE_MANAGER)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Get saved wishlist items for authenticated customer" })
  @ResponseMessage("Wishlist loaded successfully")
  async getWishlist(@CurrentUser("id") userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post()
  @ApiOperation({ summary: "Add a product to customer wishlist" })
  @ResponseMessage("Product added to wishlist")
  async addToWishlist(
    @CurrentUser("id") userId: string,
    @Body() dto: AddToWishlistDto,
  ) {
    return this.wishlistService.addToWishlist(userId, dto);
  }

  @Delete(":productId")
  @ApiOperation({ summary: "Remove a product from customer wishlist" })
  @ResponseMessage("Product removed from wishlist")
  async removeFromWishlist(
    @CurrentUser("id") userId: string,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }
}

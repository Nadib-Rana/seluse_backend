import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AddToWishlistDto } from "./dto/wishlist.dto";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });

    return items.map((item) => {
      const p = item.product;
      const colorMap = new Map<string, string>();
      const sizeSet = new Set<string>();
      let totalStock = 0;

      p.variants.forEach((v) => {
        colorMap.set(v.color, v.colorHex);
        sizeSet.add(v.size);
        totalStock += v.stock;
      });

      return {
        wishlistId: item.id,
        addedAt: item.createdAt,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          category: p.categorySlug,
          subcategory: p.subcategory,
          collection: p.collection,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          badge: p.badge,
          rating: p.rating,
          reviewCount: p.reviewCount,
          images: p.images,
          colors: Array.from(colorMap.entries()).map(([name, hex]) => ({
            label: name,
            hex,
          })),
          sizes: Array.from(sizeSet),
          stock: totalStock,
        },
      };
    });
  }

  async addToWishlist(userId: string, dto: AddToWishlistDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found");
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException("Product is already in wishlist");
    }

    return this.prisma.wishlistItem.create({
      data: {
        userId,
        productId: dto.productId,
      },
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Product is not in wishlist");
    }

    await this.prisma.wishlistItem.delete({
      where: { id: existing.id },
    });

    return { message: "Removed from wishlist successfully" };
  }
}

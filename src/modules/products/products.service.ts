import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ProductQueryDto, CreateProductDto } from "./dto/product.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query.category
        ? { categorySlug: { equals: query.category, mode: "insensitive" } }
        : {}),
      ...(query.subcategory
        ? { subcategory: { equals: query.subcategory, mode: "insensitive" } }
        : {}),
      ...(query.collection
        ? { collection: { equals: query.collection, mode: "insensitive" } }
        : {}),
      ...(query.filter
        ? { badge: { equals: query.filter, mode: "insensitive" } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
              { sku: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.priceMin || query.priceMax
        ? {
            price: {
              ...(query.priceMin ? { gte: query.priceMin } : {}),
              ...(query.priceMax ? { lte: query.priceMax } : {}),
            },
          }
        : {}),
    };

    // Handle variant color & size filters if provided
    if (query.colors || query.sizes || query.inStock) {
      const colorList = query.colors ? query.colors.split(",").map((c) => c.trim()) : [];
      const sizeList = query.sizes ? query.sizes.split(",").map((s) => s.trim()) : [];

      where.variants = {
        some: {
          ...(colorList.length > 0
            ? { color: { in: colorList, mode: "insensitive" } }
            : {}),
          ...(sizeList.length > 0
            ? { size: { in: sizeList, mode: "insensitive" } }
            : {}),
          ...(query.inStock ? { stock: { gt: 0 } } : {}),
        },
      };
    }

    // Determine sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (query.sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (query.sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (query.sort === "rating") {
      orderBy = { rating: "desc" };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          variants: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedItems = products.map((p) => {
      // Aggregate colors and sizes from variants
      const colorMap = new Map<string, string>();
      const sizeSet = new Set<string>();
      let totalStock = 0;

      p.variants.forEach((v) => {
        colorMap.set(v.color, v.colorHex);
        sizeSet.add(v.size);
        totalStock += v.stock;
      });

      const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({
        label: name,
        hex,
      }));
      const sizes = Array.from(sizeSet);

      return {
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
        colors,
        sizes,
        stock: totalStock,
        description: p.description,
        features: p.features,
      };
    });

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Product not found: ${idOrSlug}`);
    }

    const colorMap = new Map<string, string>();
    const sizeSet = new Set<string>();
    let totalStock = 0;

    product.variants.forEach((v) => {
      colorMap.set(v.color, v.colorHex);
      sizeSet.add(v.size);
      totalStock += v.stock;
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: product.categorySlug,
      subcategory: product.subcategory,
      collection: product.collection,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : null,
      badge: product.badge,
      rating: product.rating,
      reviewCount: product.reviewCount,
      images: product.images,
      colors: Array.from(colorMap.entries()).map(([name, hex]) => ({
        label: name,
        hex,
      })),
      sizes: Array.from(sizeSet),
      stock: totalStock,
      features: product.features,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
      })),
    };
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { sku: dto.sku }],
      },
    });

    if (existing) {
      throw new ConflictException("Product with this slug or SKU already exists");
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        sku: dto.sku,
        categorySlug: dto.categorySlug,
        categoryId: dto.categoryId,
        subcategory: dto.subcategory,
        collection: dto.collection,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice || null,
        badge: dto.badge || null,
        images: dto.images,
        features: dto.features || {},
        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                sku: v.sku,
                size: v.size,
                color: v.color,
                colorHex: v.colorHex,
                stock: v.stock,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "Product deactivated successfully" };
  }
}

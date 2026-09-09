import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const mockProducts = [
  {
    id: "p1",
    name: "Oxford Slim Fit Shirt",
    category: "men",
    subcategory: "Shirts",
    price: 1890,
    originalPrice: 2490,
    rating: 4.8,
    reviews: 142,
    images: [
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=700&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&h=900&fit=crop&auto=format",
    ],
    colors: [
      { name: "White", hex: "#F8F8F8" },
      { name: "Sky Blue", hex: "#87CEEB" },
      { name: "Charcoal", hex: "#36454F" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "Sale",
    stock: 48,
    description: "A refined slim-fit Oxford shirt crafted from premium Egyptian cotton. The structured collar and clean finish make it ideal for both formal and smart-casual settings.",
    material: "100% Egyptian Cotton",
    sku: "MSH-OXF-001",
    collection: "Essentials",
  },
  {
    id: "p2",
    name: "Essential Crewneck Tee",
    category: "men",
    subcategory: "T-Shirts",
    price: 790,
    rating: 4.6,
    reviews: 289,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=700&h=900&fit=crop&auto=format",
    ],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#111111" },
      { name: "Stone", hex: "#C2B280" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    badge: "Best Seller",
    stock: 120,
    description: "Our signature heavyweight tee in 220gsm ring-spun cotton. Pre-shrunk and garment-washed for a perfectly lived-in drape from day one.",
    material: "220gsm Ring-Spun Cotton",
    sku: "MTS-ECR-002",
    collection: "Essentials",
  },
  {
    id: "p3",
    name: "Relaxed Chino Trousers",
    category: "men",
    subcategory: "Pants",
    price: 2290,
    originalPrice: 2890,
    rating: 4.5,
    reviews: 98,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&h=900&fit=crop&auto=format",
    ],
    colors: [
      { name: "Khaki", hex: "#C3B091" },
      { name: "Olive", hex: "#6B7C59" },
      { name: "Navy", hex: "#1B2A4A" },
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    badge: "Sale",
    stock: 35,
    description: "Tailored in a relaxed silhouette from stretch-twill fabric. Features a mid-rise cut with tapered leg and functional side pockets.",
    material: "97% Cotton, 3% Elastane",
    sku: "MPT-CHN-003",
    collection: "Essentials",
  },
  {
    id: "p4",
    name: "Linen Wrap Midi Dress",
    category: "women",
    subcategory: "Dresses",
    price: 3490,
    rating: 4.9,
    reviews: 176,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&h=900&fit=crop&auto=format",
    ],
    colors: [
      { name: "Terracotta", hex: "#E07A5F" },
      { name: "Sage", hex: "#81B29A" },
      { name: "Ivory", hex: "#F4F1DE" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    badge: "New",
    stock: 22,
    description: "An elegant wrap dress cut from pure French linen. V-neckline with adjustable waist tie and flowy A-line skirt designed for warm summer days.",
    material: "100% French Linen",
    sku: "WDR-LWR-004",
    collection: "Summer Collection",
  },
];

async function main() {
  console.log("🌱 Seeding Seluse database...");

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 1. Seed Roles & Users
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@drape.com" },
    update: {},
    create: {
      fullName: "Super Admin",
      email: "admin@drape.com",
      phone: "+8801700000000",
      passwordHash: defaultPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const storeManager = await prisma.user.upsert({
    where: { email: "manager@drape.com" },
    update: {},
    create: {
      fullName: "Store Manager",
      email: "manager@drape.com",
      phone: "+8801711111111",
      passwordHash: defaultPassword,
      role: Role.STORE_MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  const csr = await prisma.user.upsert({
    where: { email: "csr@drape.com" },
    update: {},
    create: {
      fullName: "Customer Support",
      email: "csr@drape.com",
      phone: "+8801722222222",
      passwordHash: defaultPassword,
      role: Role.CUSTOMER_SERVICE,
      status: UserStatus.ACTIVE,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@drape.com" },
    update: {},
    create: {
      fullName: "Nadib Rana",
      email: "customer@drape.com",
      phone: "+8801733333333",
      passwordHash: defaultPassword,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Seeded Users: SuperAdmin (${superAdmin.email}), Manager (${storeManager.email}), CSR (${csr.email}), Customer (${customer.email})`);

  // 2. Seed Categories
  const catMen = await prisma.category.upsert({
    where: { slug: "men" },
    update: {},
    create: {
      name: "Men",
      slug: "men",
      description: "Men's Apparel & Accessories",
      priority: 1,
    },
  });

  const catWomen = await prisma.category.upsert({
    where: { slug: "women" },
    update: {},
    create: {
      name: "Women",
      slug: "women",
      description: "Women's Fashion & Dresses",
      priority: 2,
    },
  });

  const catKids = await prisma.category.upsert({
    where: { slug: "kids" },
    update: {},
    create: {
      name: "Kids",
      slug: "kids",
      description: "Kids & Youth Collection",
      priority: 3,
    },
  });

  console.log(`✅ Seeded Categories: ${catMen.name}, ${catWomen.name}, ${catKids.name}`);

  // 3. Seed Products & Variants
  for (const p of mockProducts) {
    const category = p.category === "men" ? catMen : p.category === "women" ? catWomen : catKids;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        slug: p.sku.toLowerCase(),
        sku: p.sku,
        categorySlug: p.category,
        categoryId: category.id,
        collection: p.collection,
        subcategory: p.subcategory,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice || null,
        badge: p.badge || null,
        rating: p.rating,
        reviewCount: p.reviews,
        images: p.images,
        features: { material: p.material },
      },
    });

    // Create Variants for colors & sizes
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const variantSku = `${p.sku}-${color.name.toUpperCase()}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku: variantSku },
          update: {},
          create: {
            productId: product.id,
            sku: variantSku,
            size: size,
            color: color.name,
            colorHex: color.hex,
            stock: Math.floor(p.stock / (p.colors.length * p.sizes.length)) + 5,
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${mockProducts.length} Products with Variants`);

  // 4. Seed Coupons
  const couponWinter = await prisma.coupon.upsert({
    where: { code: "WINTER10" },
    update: {},
    create: {
      code: "WINTER10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minSpend: 1000,
      maxDiscount: 500,
      usageLimit: 1000,
      usedCount: 15,
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      isActive: true,
    },
  });

  const couponFlat = await prisma.coupon.upsert({
    where: { code: "FLAT500" },
    update: {},
    create: {
      code: "FLAT500",
      discountType: "FIXED",
      discountValue: 500,
      minSpend: 3000,
      usageLimit: 500,
      usedCount: 42,
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      isActive: true,
    },
  });
  console.log(`✅ Seeded Coupons: ${couponWinter.code}, ${couponFlat.code}`);

  // 5. Seed Campaign
  const campaignSummer = await prisma.campaign.upsert({
    where: { slug: "summer-collection-2026" },
    update: {},
    create: {
      title: "Summer Collection 2026",
      slug: "summer-collection-2026",
      description: "Discover fresh drapes and warm weather essentials.",
      bannerUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200",
      discountPct: 20,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-09-30"),
      isActive: true,
    },
  });
  console.log(`✅ Seeded Campaign: ${campaignSummer.title}`);

  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

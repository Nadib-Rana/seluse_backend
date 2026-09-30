const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({ where: { name: "Relaxed Chino Trousers" }});
  if (!p) return console.log("Product not found");
  const v = await prisma.productVariant.findMany({ where: { productId: p.id }});
  console.log(v);
}
main();

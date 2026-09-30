const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const v = await prisma.productVariant.findMany({ where: { productId: "d5000871-3f4d-474b-a9ab-669d2205ec4b" }});
  console.log(v);
}
main();

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company1 = await prisma.company.findFirst({ where: { code: "AST" } });
  const companyAdmin1 = await prisma.user.findFirst({ where: { email: "admin@company1.com" } });
  const product1 = await prisma.product.findFirst({ where: { slug: "steel-shelf-5tier" }, include: { variants: true } });
  const product2 = await prisma.product.findFirst({ where: { slug: "living-room-carpet" }, include: { variants: true } });

  if (!company1 || !companyAdmin1 || !product1 || !product2) return console.error("Missing base data, did you drop the DB?");

  // Avoid recreating if already seeded
  const existingSup = await prisma.supplier.findFirst({ where: { code: "SUP-001" } });
  if (existingSup) {
    console.log("Already seeded suppliers.");
    return;
  }

  const supp1 = await prisma.supplier.create({
    data: {
      code: "SUP-001", name: "บริษัท ไม้ประดับไทย จำกัด", taxId: "0105556001234", address: "100 ถนนบางนา-ตราด กรุงเทพฯ", phone: "02-333-4444", companyId: company1.id,
    }
  });

  const supp2 = await prisma.supplier.create({
    data: {
      code: "SUP-002", name: "หจก. อุปกรณ์เฟอร์นิเจอร์", taxId: "0105556005678", address: "200 ถนนรามคำแหง กรุงเทพฯ", phone: "02-555-6666", companyId: company1.id,
    }
  });

  await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-260320-0001", supplierId: supp1.id, companyId: company1.id, status: "APPROVED", totalAmount: 18000, createdById: companyAdmin1.id, approvedById: companyAdmin1.id, note: "สั่งไม้สำหรับผลิตเฟอร์นิเจอร์",
      items: {
        create: [
          { productVariantId: product1.variants[0].id, quantity: 10, unitPrice: 1500, totalPrice: 15000 },
          { productVariantId: product1.variants[2].id, quantity: 5, unitPrice: 600, totalPrice: 3000 },
        ]
      }
    }
  });

  await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-260320-0002", supplierId: supp2.id, companyId: company1.id, status: "DRAFT", totalAmount: 22000, createdById: companyAdmin1.id, note: "สั่งพรมเสริมสต็อก",
      items: {
        create: [
          { productVariantId: product2.variants[0].id, quantity: 10, unitPrice: 2200, totalPrice: 22000 },
        ]
      }
    }
  });
  console.log("✅ Seeded POs and Suppliers successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 เริ่มเพิ่มข้อมูลตัวอย่าง...");

  // ============================================================
  // 1. Companies
  // ============================================================
  const company1 = await prisma.company.create({
    data: {
      name: "Astun Trading Co., Ltd.",
      code: "AST",
      address: "123 ถนนสุขุมวิท กรุงเทพมหานคร 10110",
      phone: "02-123-4567",
      email: "info@astun.com",
      taxId: "0105556000001",
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Bright Materials Co., Ltd.",
      code: "BRM",
      address: "456 ถนนพระราม 9 กรุงเทพมหานคร 10320",
      phone: "02-987-6543",
      email: "info@bright.com",
      taxId: "0105556000002",
    },
  });

  console.log("✅ สร้างบริษัท 2 แห่ง");

  // ============================================================
  // 2. Branches
  // ============================================================
  const branch1 = await prisma.branch.create({
    data: { name: "สาขากรุงเทพ (สำนักงานใหญ่)", code: "BKK-HQ", companyId: company1.id, address: "กรุงเทพมหานคร", phone: "02-123-4567" },
  });
  const branch2 = await prisma.branch.create({
    data: { name: "สาขาเชียงใหม่", code: "CNX", companyId: company1.id, address: "เชียงใหม่", phone: "053-123-456" },
  });
  const branch3 = await prisma.branch.create({
    data: { name: "สาขาชลบุรี", code: "CBI", companyId: company1.id, address: "ชลบุรี", phone: "038-123-456" },
  });
  const branch4 = await prisma.branch.create({
    data: { name: "สาขากรุงเทพ", code: "BKK", companyId: company2.id, address: "กรุงเทพมหานคร", phone: "02-987-6543" },
  });
  const branch5 = await prisma.branch.create({
    data: { name: "สาขาขอนแก่น", code: "KKC", companyId: company2.id, address: "ขอนแก่น", phone: "043-123-456" },
  });

  console.log("✅ สร้างสาขา 5 แห่ง");

  // ============================================================
  // 3. Warehouses
  // ============================================================
  const wh1 = await prisma.warehouse.create({ data: { name: "คลังกลาง กรุงเทพ", code: "WH-BKK-01", branchId: branch1.id } });
  const wh2 = await prisma.warehouse.create({ data: { name: "คลังสำรอง กรุงเทพ", code: "WH-BKK-02", branchId: branch1.id } });
  const wh3 = await prisma.warehouse.create({ data: { name: "คลังเชียงใหม่", code: "WH-CNX-01", branchId: branch2.id } });
  const wh4 = await prisma.warehouse.create({ data: { name: "คลังชลบุรี", code: "WH-CBI-01", branchId: branch3.id } });
  const wh5 = await prisma.warehouse.create({ data: { name: "คลัง Bright กรุงเทพ", code: "WH-BRM-01", branchId: branch4.id } });
  const wh6 = await prisma.warehouse.create({ data: { name: "คลังขอนแก่น", code: "WH-KKC-01", branchId: branch5.id } });

  console.log("✅ สร้างคลังสินค้า 6 แห่ง");

  // ============================================================
  // 4. Users
  // ============================================================
  const passwordHash = await hash("password123", 10);

  const superAdmin = await prisma.user.create({ data: { name: "Admin ระบบ", email: "superadmin@astun.com", password: passwordHash, role: "SUPER_ADMIN" } });
  await prisma.user.create({ data: { name: "เจ้าของ ธนกร", email: "owner@astun.com", password: passwordHash, role: "OWNER" } });
  const companyAdmin1 = await prisma.user.create({ data: { name: "สมชาย ผู้ดูแล", email: "admin@company1.com", password: passwordHash, role: "COMPANY_ADMIN", companyId: company1.id } });
  await prisma.user.create({ data: { name: "วิชัย สาขา", email: "branch@astun.com", password: passwordHash, role: "BRANCH_ADMIN", companyId: company1.id, branchId: branch2.id } });
  await prisma.user.create({ data: { name: "สมหญิง พนักงาน", email: "staff@astun.com", password: passwordHash, role: "STAFF", companyId: company1.id, branchId: branch1.id } });
  await prisma.user.create({ data: { name: "อนุชา ผู้ดูแล", email: "admin@bright.com", password: passwordHash, role: "COMPANY_ADMIN", companyId: company2.id } });
  await prisma.user.create({ data: { name: "สุรชัย พนักงาน", email: "staff@bright.com", password: passwordHash, role: "STAFF", companyId: company2.id, branchId: branch4.id } });

  console.log("✅ สร้างผู้ใช้ 7 คน");

  // ============================================================
  // 5. Categories
  // ============================================================
  const cat1 = await prisma.category.create({ data: { name: "เฟอร์นิเจอร์", slug: "furniture", companyId: company1.id } });
  const cat2 = await prisma.category.create({ data: { name: "พรมและของตกแต่ง", slug: "carpet-decor", companyId: company1.id } });
  const cat3 = await prisma.category.create({ data: { name: "วัสดุก่อสร้าง", slug: "construction", companyId: company1.id } });
  const cat4 = await prisma.category.create({ data: { name: "วัสดุตกแต่ง", slug: "finishing-material", companyId: company2.id } });

  console.log("✅ สร้างหมวดหมู่ 4 หมวด");

  // ============================================================
  // 6. Products & Variants
  // ============================================================
  const product1 = await prisma.product.create({
    data: {
      name: "ชั้นวางเหล็ก 5 ชั้น งานหนัก", slug: "steel-shelf-5tier", companyId: company1.id, categoryId: cat1.id,
      description: "ชั้นวางเหล็กทนทาน รับน้ำหนักได้ 500kg ต่อชั้น", image: "🏗️",
      variants: {
        create: [
          { sku: "AST-SH-001", name: "200x200x60 - เทา", size: "200x200x60", color: "เทา", material: "เหล็ก", price: 2490, cost: 1500 },
          { sku: "AST-SH-002", name: "200x200x60 - ขาว", size: "200x200x60", color: "ขาว", material: "เหล็ก", price: 2690, cost: 1600 },
          { sku: "AST-SH-003", name: "150x150x50 - เทา", size: "150x150x50", color: "เทา", material: "เหล็ก", price: 1890, cost: 1100 },
        ],
      },
    },
    include: { variants: true },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "พรมปูพื้นห้องนั่งเล่น ขนนุ่ม", slug: "living-room-carpet", companyId: company1.id, categoryId: cat2.id,
      description: "พรมขนนุ่มคุณภาพสูง กันลื่น ทำความสะอาดง่าย", image: "🏠",
      variants: {
        create: [
          { sku: "AST-CP-001", name: "3x4 เมตร - น้ำตาล", size: "3x4", color: "น้ำตาล", material: "ไนลอน", price: 3990, cost: 2200 },
          { sku: "AST-CP-002", name: "3x4 เมตร - เทา", size: "3x4", color: "เทา", material: "ไนลอน", price: 3990, cost: 2200 },
        ],
      },
    },
    include: { variants: true },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "ปูนซีเมนต์คุณภาพสูง", slug: "cement", companyId: company1.id, categoryId: cat3.id,
      description: "ปูนซีเมนต์สำหรับงานก่อสร้างทั่วไป", image: "🧱",
      variants: {
        create: [
          { sku: "AST-CM-001", name: "ถุง 50kg", size: "50kg", material: "ปูนซีเมนต์", price: 180, cost: 120 },
        ],
      },
    },
    include: { variants: true },
  });

  const product4 = await prisma.product.create({
    data: {
      name: "โต๊ะทำงานไม้ MDF พร้อมลิ้นชัก", slug: "mdf-desk", companyId: company2.id, categoryId: cat4.id,
      description: "โต๊ะทำงานดีไซน์ทันสมัย", image: "💼",
      variants: {
        create: [
          { sku: "BRM-DK-001", name: "120x60cm - ธรรมชาติ", size: "120x60", color: "ธรรมชาติ", material: "MDF", price: 3290, cost: 1900 },
          { sku: "BRM-DK-002", name: "120x60cm - วอลนัท", size: "120x60", color: "วอลนัท", material: "MDF", price: 3490, cost: 2000 },
        ],
      },
    },
    include: { variants: true },
  });

  console.log("✅ สร้างสินค้า 4 รายการ + Variants");

  // ============================================================
  // 7. Stock
  // ============================================================
  const stockData = [
    { productVariantId: product1.variants[0].id, warehouseId: wh1.id, companyId: company1.id, quantity: 45, minQuantity: 10 },
    { productVariantId: product1.variants[1].id, warehouseId: wh1.id, companyId: company1.id, quantity: 3, minQuantity: 10 },
    { productVariantId: product1.variants[2].id, warehouseId: wh1.id, companyId: company1.id, quantity: 30, minQuantity: 10 },
    { productVariantId: product1.variants[0].id, warehouseId: wh3.id, companyId: company1.id, quantity: 20, minQuantity: 5 },
    { productVariantId: product2.variants[0].id, warehouseId: wh3.id, companyId: company1.id, quantity: 2, minQuantity: 5 },
    { productVariantId: product2.variants[1].id, warehouseId: wh1.id, companyId: company1.id, quantity: 15, minQuantity: 5 },
    { productVariantId: product3.variants[0].id, warehouseId: wh1.id, companyId: company1.id, quantity: 200, minQuantity: 50 },
    { productVariantId: product3.variants[0].id, warehouseId: wh4.id, companyId: company1.id, quantity: 100, minQuantity: 30 },
    { productVariantId: product4.variants[0].id, warehouseId: wh5.id, companyId: company2.id, quantity: 8, minQuantity: 10 },
    { productVariantId: product4.variants[1].id, warehouseId: wh5.id, companyId: company2.id, quantity: 15, minQuantity: 10 },
    { productVariantId: product4.variants[0].id, warehouseId: wh6.id, companyId: company2.id, quantity: 12, minQuantity: 5 },
  ];
  for (const stock of stockData) {
    await prisma.stock.create({ data: stock });
  }
  console.log("✅ สร้างสต็อก 11 รายการ");

  // ============================================================
  // 8. Orders (status = RECEIVED per new flow)
  // ============================================================
  await prisma.order.create({
    data: {
      orderNumber: "ORD-260320-0001",
      customerName: "สมชาย สมบูรณ์",
      customerPhone: "081-234-5678",
      customerAddress: "123 ซอย 5 ถนนสุขุมวิท กรุงเทพฯ",
      status: "RECEIVED",
      totalAmount: 12460,
      companyId: company1.id, branchId: branch1.id, warehouseId: wh1.id,
      items: {
        create: [
          { productVariantId: product1.variants[0].id, quantity: 3, unitPrice: 2490, totalPrice: 7470 },
          { productVariantId: product2.variants[1].id, quantity: 1, unitPrice: 3990, totalPrice: 3990 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "ORD-260320-0002",
      customerName: "วิชัย ใจดี",
      customerPhone: "082-345-6789",
      customerAddress: "456 ถ.ห้วยแก้ว เชียงใหม่",
      status: "PREPARING",
      totalAmount: 8970,
      companyId: company1.id, branchId: branch2.id, warehouseId: wh3.id,
      items: {
        create: [
          { productVariantId: product1.variants[0].id, quantity: 2, unitPrice: 2490, totalPrice: 4980 },
          { productVariantId: product2.variants[0].id, quantity: 1, unitPrice: 3990, totalPrice: 3990 },
        ],
      },
    },
  });

  console.log("✅ สร้างคำสั่งซื้อ 2 รายการ");

  // ============================================================
  // 9. Stock Transfer (same company only)
  // ============================================================
  await prisma.stockTransfer.create({
    data: {
      transferNumber: "TF-260320-0001",
      companyId: company1.id,
      fromWarehouseId: wh1.id,
      toWarehouseId: wh3.id,
      status: "PENDING",
      requestedById: companyAdmin1.id,
      note: "เติมสต็อกสาขาเชียงใหม่",
      items: {
        create: [
          { productVariantId: product1.variants[0].id, quantity: 10 },
          { productVariantId: product1.variants[2].id, quantity: 5 },
        ],
      },
      logs: {
        create: [
          { action: "CREATED", performedById: companyAdmin1.id, note: "สร้างใบโอนสต็อก" },
        ],
      },
    },
  });

  console.log("✅ สร้างใบโอนสต็อก 1 รายการ");

  // ============================================================
  // 10. Intercompany Transaction
  // ============================================================
  await prisma.intercompanyTransaction.create({
    data: {
      transactionNumber: "IC-260320-0001",
      fromCompanyId: company1.id,
      toCompanyId: company2.id,
      status: "DRAFT",
      totalAmount: 15000,
      createdById: superAdmin.id,
      note: "Astun ส่งชั้นวางให้ Bright",
      items: {
        create: [
          { productVariantId: product1.variants[0].id, quantity: 5, unitPrice: 1500, totalPrice: 7500 },
          { productVariantId: product1.variants[2].id, quantity: 5, unitPrice: 1100, totalPrice: 5500 },
        ],
      },
    },
  });

  console.log("✅ สร้าง Intercompany Transaction 1 รายการ");

  // ============================================================
  // 11. Suppliers
  // ============================================================
  const supp1 = await prisma.supplier.create({
    data: {
      code: "SUP-001",
      name: "บริษัท ไม้ประดับไทย จำกัด",
      taxId: "0105556001234",
      address: "100 ถนนบางนา-ตราด กรุงเทพฯ",
      phone: "02-333-4444",
      companyId: company1.id,
    }
  });

  const supp2 = await prisma.supplier.create({
    data: {
      code: "SUP-002",
      name: "หจก. อุปกรณ์เฟอร์นิเจอร์",
      taxId: "0105556005678",
      address: "200 ถนนรามคำแหง กรุงเทพฯ",
      phone: "02-555-6666",
      companyId: company1.id,
    }
  });

  console.log("✅ สร้างผู้จัดจำหน่าย 2 รายการ");

  // ============================================================
  // 12. Purchase Orders
  // ============================================================
  await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-260320-0001",
      supplierId: supp1.id,
      companyId: company1.id,
      status: "APPROVED",
      totalAmount: 18000,
      createdById: companyAdmin1.id,
      approvedById: companyAdmin1.id,
      note: "สั่งไม้สำหรับผลิตเฟอร์นิเจอร์",
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
      poNumber: "PO-260320-0002",
      supplierId: supp2.id,
      companyId: company1.id,
      status: "DRAFT",
      totalAmount: 22000,
      createdById: companyAdmin1.id,
      note: "สั่งพรมเสริมสต็อก",
      items: {
        create: [
          { productVariantId: product2.variants[0].id, quantity: 10, unitPrice: 2200, totalPrice: 22000 },
        ]
      }
    }
  });

  console.log("✅ สร้าง Purchase Order 2 รายการ");

  // ============================================================
  // 13. Expenses
  // ============================================================
  const catTransport = await prisma.expenseCategory.upsert({
    where: { companyId_name: { companyId: company1.id, name: "ค่าเดินทาง" } },
    update: {},
    create: { name: "ค่าเดินทาง", companyId: company1.id },
  });

  const catOffice = await prisma.expenseCategory.upsert({
    where: { companyId_name: { companyId: company1.id, name: "เครื่องใช้สำนักงาน" } },
    update: {},
    create: { name: "เครื่องใช้สำนักงาน", companyId: company1.id },
  });

  const catUtility = await prisma.expenseCategory.upsert({
    where: { companyId_name: { companyId: company1.id, name: "สาธารณูปโภค" } },
    update: {},
    create: { name: "สาธารณูปโภค", companyId: company1.id },
  });

  console.log("✅ สร้าง Expense Categories 3 หมวด");

  const expensesToCreate = [
    {
      expenseNumber: "EXP-240327-0001",
      title: "เติมน้ำมันรถขนส่งคันที่ 1",
      amount: 1200,
      date: new Date(),
      categoryId: catTransport.id,
      paymentMethod: "CASH",
    },
    {
      expenseNumber: "EXP-240327-0002",
      title: "ค่าไฟสาขากรุงเทพ",
      amount: 4500,
      date: new Date(new Date().setHours(new Date().getHours() - 24)),
      categoryId: catUtility.id,
      paymentMethod: "TRANSFER",
      description: "รอบบิล มี.ค. 2026",
    },
    {
      expenseNumber: "EXP-240327-0003",
      title: "ซื้อกระดาษ A4",
      amount: 450,
      date: new Date(new Date().setHours(new Date().getHours() - 48)),
      categoryId: catOffice.id,
      paymentMethod: "CASH",
    }
  ];

  for (const exp of expensesToCreate) {
    await prisma.expense.create({
      data: {
        ...exp,
        companyId: company1.id,
        branchId: branch1.id,
        createdById: companyAdmin1.id,
        approvedById: companyAdmin1.id,
        status: "APPROVED",
      }
    });
  }

  console.log("✅ สร้าง Data Expenses 3 รายการ");

  console.log("\n🎉 เพิ่มข้อมูลตัวอย่างเสร็จสิ้น!");
  console.log("📋 สรุป:");
  console.log("   - 2 บริษัท, 5 สาขา, 6 คลังสินค้า");
  console.log("   - 7 ผู้ใช้ (ครบทุก Role)");
  console.log("   - 4 สินค้า + 8 Variants, 11 สต็อก");
  console.log("   - 2 คำสั่งซื้อ, 1 ใบโอนสต็อก, 1 Intercompany");
  console.log("   - 2 ผู้จัดจำหน่าย, 2 Purchase Orders, 3 รายการค่าใช้จ่าย");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

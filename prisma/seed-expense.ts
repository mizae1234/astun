import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company1 = await prisma.company.findFirst({ where: { code: "AST" } });
  const branch1 = await prisma.branch.findFirst({ where: { code: "BKK-HQ" } });
  const admin = await prisma.user.findFirst({ where: { email: "admin@company1.com" } });
  const bblAccount = await prisma.bankAccount.findFirst({ where: { bankName: "กรุงเทพ" } });

  if (!company1 || !branch1 || !admin) {
    return console.error("Missing base data, did you drop the DB?");
  }

  // Create Categories First
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

  console.log("✅ Seeded Expense Categories");

  // Avoid recreation
  const existingExpenses = await prisma.expense.count({ where: { companyId: company1.id } });
  if (existingExpenses > 0) {
    console.log("✅ Expenses already seeded. Use UI for more.");
    return;
  }

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
      bankAccountId: bblAccount?.id,
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
        createdById: admin.id,
        approvedById: admin.id,
        status: "APPROVED",
      }
    });
  }

  console.log("✅ Seeded 3 Data Expenses (ค่าใช้จ่าย)");
}

main().catch(console.error).finally(() => prisma.$disconnect());

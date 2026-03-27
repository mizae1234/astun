"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/access-control";

export async function getBankAccounts() {
  const user = await getSession();
  if (!user) return [];

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  return prisma.bankAccount.findMany({
    where: companyFilter,
    orderBy: { isDefault: "desc" },
  });
}

export async function getFinanceReportData(startDateIso: string, endDateIso: string) {
  const user = await getSession();
  if (!user) return null;

  // Fix timezone shift by explicitly parsing local year, month, date
  const [sYear, sMonth, sDay] = startDateIso.split("-").map(Number);
  const startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0);

  const [eYear, eMonth, eDay] = endDateIso.split("-").map(Number);
  const endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  // Fetch all active orders in date range
  const orders = await prisma.order.findMany({
    where: {
      ...companyFilter,
      createdAt: { gte: startDate, lte: endDate },
      status: { not: "CANCELLED" },
    },
    include: {
      bankAccount: true
    }
  });

  // Calculate totals by payment method
  let cashTotal = 0;
  let creditTotal = 0;
  let transferTotal = 0;

  // Breakdown by Bank Account
  const bankAccountTotals = new Map<string, { id: string, name: string, bank: string, number: string, amount: number }>();

  for (const order of orders) {
    if (order.paymentMethod === "CASH") cashTotal += order.totalAmount;
    else if (order.paymentMethod === "CREDIT") creditTotal += order.totalAmount;
    else if (order.paymentMethod === "TRANSFER") {
      transferTotal += order.totalAmount;
      if (order.bankAccount) {
        const key = order.bankAccount.id;
        if (!bankAccountTotals.has(key)) {
          bankAccountTotals.set(key, {
            id: key,
            name: order.bankAccount.accountName,
            bank: order.bankAccount.bankName,
            number: order.bankAccount.accountNumber,
            amount: 0
          });
        }
        bankAccountTotals.get(key)!.amount += order.totalAmount;
      } else {
        // Unknown bank account
        const key = "unknown";
        if (!bankAccountTotals.has(key)) {
          bankAccountTotals.set(key, {
            id: key,
            name: "ไม่ได้ระบุบัญชี",
            bank: "-",
            number: "-",
            amount: 0
          });
        }
        bankAccountTotals.get(key)!.amount += order.totalAmount;
      }
    }
  }

  const bankAccountList = Array.from(bankAccountTotals.values()).sort((a, b) => b.amount - a.amount);

  // Fetch expenses
  const expenses = await prisma.expense.findMany({
    where: {
      ...companyFilter,
      date: { gte: startDate, lte: endDate },
      isActive: true,
    },
    include: {
      category: { select: { name: true } },
    }
  });

  let totalExpense = 0;
  const expenseByCategory = new Map<string, { id: string, name: string, amount: number }>();

  for (const exp of expenses) {
    totalExpense += exp.amount;
    const catId = exp.categoryId;
    if (!expenseByCategory.has(catId)) {
      expenseByCategory.set(catId, {
        id: catId,
        name: exp.category.name,
        amount: 0
      });
    }
    expenseByCategory.get(catId)!.amount += exp.amount;
  }

  const expenseCategoryList = Array.from(expenseByCategory.values()).sort((a, b) => b.amount - a.amount);
  const totalRevenue = cashTotal + creditTotal + transferTotal;
  const netProfit = totalRevenue - totalExpense;

  return {
    totalRevenue,
    cashTotal,
    creditTotal,
    transferTotal,
    bankAccountList,
    totalExpense,
    netProfit,
    expenseCategoryList
  };
}

export async function getInventoryReportData(warehouseId?: string) {
  const user = await getSession();
  if (!user) return null;

  const companyFilter =
    user.role === "SUPER_ADMIN" || user.role === "OWNER"
      ? {}
      : { companyId: user.companyId! };

  // Fetch all active products and their variants with stocks
  const products = await prisma.product.findMany({
    where: { ...companyFilter, isActive: true },
    include: {
      category: { select: { name: true } },
      variants: {
        where: { isActive: true },
        include: {
          stocks: {
            include: { warehouse: { select: { name: true } } }
          }
        }
      }
    }
  });

  let totalItems = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  const items: any[] = [];

  for (const product of products) {
    for (const v of product.variants) {
      const relevantStocks = warehouseId 
        ? v.stocks.filter((s: any) => s.warehouseId === warehouseId) 
        : v.stocks;

      const qty = relevantStocks.reduce((sum: number, s: any) => sum + s.quantity, 0);
      
      if (qty !== 0) { // Include both positive and negative stocks (if any)
        const costValue = qty * v.cost;
        const retailValue = qty * v.price;
        
        if (qty > 0) {
          totalItems += qty;
          totalCostValue += costValue;
          totalRetailValue += retailValue;
        }

        items.push({
          id: v.id,
          productId: product.id,
          productName: product.name,
          categoryName: product.category?.name || "ไม่มีหมวดหมู่",
          variantName: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          cost: v.cost,
          quantity: qty,
          costValue: costValue,
          retailValue: retailValue,
          stocks: v.stocks.map((s: any) => ({
            warehouse: s.warehouse.name,
            quantity: s.quantity
          }))
        });
      }
    }
  }

  // Sort by highest cost value
  items.sort((a, b) => b.costValue - a.costValue);

  return {
    totalItems,
    totalCostValue,
    totalRetailValue,
    items
  };
}

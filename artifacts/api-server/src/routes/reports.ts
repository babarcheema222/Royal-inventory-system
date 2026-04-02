import { Router, type IRouter } from "express";
import { db, transactionsTable, subcategoriesTable, usersTable, categoriesTable } from "@workspace/db";
import { eq, desc, gte, lte, sql, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { GetDailyReportQueryParams, GetRangeReportQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function fetchTransactions(from: Date, to: Date) {
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      id: transactionsTable.id,
      subcategoryId: transactionsTable.subcategoryId,
      subcategoryName: subcategoriesTable.name,
      categoryName: categoriesTable.name,
      type: transactionsTable.type,
      quantity: transactionsTable.quantity,
      notes: transactionsTable.notes,
      userId: transactionsTable.userId,
      username: usersTable.username,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .innerJoin(subcategoriesTable, eq(transactionsTable.subcategoryId, subcategoriesTable.id))
    .innerJoin(categoriesTable, eq(subcategoriesTable.categoryId, categoriesTable.id))
    .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(and(gte(transactionsTable.createdAt, from), lte(transactionsTable.createdAt, toEnd)))
    .orderBy(desc(transactionsTable.createdAt));

  return rows;
}

router.get("/reports/daily", requireAdmin, async (req, res): Promise<void> => {
  const queryParams = GetDailyReportQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const dateStr = queryParams.data.date as string;
  const from = new Date(dateStr);
  from.setHours(0, 0, 0, 0);
  const to = new Date(dateStr);
  to.setHours(23, 59, 59, 999);

  const transactions = await fetchTransactions(from, to);

  const totalIn = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  res.json({
    date: dateStr,
    transactions,
    summary: {
      totalIn,
      totalOut,
      totalTransactions: transactions.length,
    },
  });
});

router.get("/reports/range", requireAdmin, async (req, res): Promise<void> => {
  const queryParams = GetRangeReportQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const fromStr = queryParams.data.from as string;
  const toStr = queryParams.data.to as string;
  const from = new Date(fromStr);
  const to = new Date(toStr);

  const transactions = await fetchTransactions(from, to);

  const totalIn = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  res.json({
    from: fromStr,
    to: toStr,
    transactions,
    summary: {
      totalIn,
      totalOut,
      totalTransactions: transactions.length,
    },
  });
});

export default router;

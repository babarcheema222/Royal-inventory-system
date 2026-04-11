import { Router, type IRouter } from "express";
import { db, subcategoriesTable, categoriesTable, transactionsTable } from "@workspace/db";
import { eq, lt, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { ListInventoryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", requireAuth, async (req, res): Promise<void> => {
  const queryParams = ListInventoryQueryParams.safeParse(req.query);

  const subs = await db
    .select({
      id: subcategoriesTable.id,
      name: subcategoriesTable.name,
      categoryId: subcategoriesTable.categoryId,
      categoryName: categoriesTable.name,
      unit: categoriesTable.unit,
      currentStock: subcategoriesTable.currentStock,
      createdAt: subcategoriesTable.createdAt,
    })
    .from(subcategoriesTable)
    .innerJoin(categoriesTable, eq(subcategoriesTable.categoryId, categoriesTable.id))
    .orderBy(categoriesTable.name, subcategoriesTable.name);

  let filtered = subs;
  if (queryParams.success && queryParams.data.search) {
    const search = queryParams.data.search.toLowerCase();
    filtered = subs.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.categoryName.toLowerCase().includes(search)
    );
  }

  const result = filtered.map((item) => ({
    ...item,
    isLowStock: item.currentStock < 10,
  }));

  res.json(result);
});

router.get("/inventory/low-stock", requireAuth, async (_req, res): Promise<void> => {
  const subs = await db
    .select({
      id: subcategoriesTable.id,
      name: subcategoriesTable.name,
      categoryId: subcategoriesTable.categoryId,
      categoryName: categoriesTable.name,
      unit: categoriesTable.unit,
      currentStock: subcategoriesTable.currentStock,
      createdAt: subcategoriesTable.createdAt,
    })
    .from(subcategoriesTable)
    .innerJoin(categoriesTable, eq(subcategoriesTable.categoryId, categoriesTable.id))
    .where(lt(subcategoriesTable.currentStock, 10))
    .orderBy(subcategoriesTable.currentStock);

  const result = subs.map((item) => ({
    ...item,
    isLowStock: true,
  }));

  res.json(result);
});

router.get("/inventory/summary", requireAuth, async (_req, res): Promise<void> => {
  const [totalItemsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subcategoriesTable);

  const [lowStockRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subcategoriesTable)
    .where(lt(subcategoriesTable.currentStock, 10));

  const [totalCategoriesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categoriesTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayTransactionsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(sql`${transactionsTable.createdAt} >= ${today}`);

  res.json({
    totalItems: totalItemsRow?.count ?? 0,
    lowStockCount: lowStockRow?.count ?? 0,
    totalCategories: totalCategoriesRow?.count ?? 0,
    totalTransactionsToday: todayTransactionsRow?.count ?? 0,
  });
});

export default router;

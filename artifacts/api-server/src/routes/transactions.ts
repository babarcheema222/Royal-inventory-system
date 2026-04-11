import { Router, type IRouter } from "express";
import { db, transactionsTable, subcategoriesTable, usersTable, categoriesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateTransactionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/transactions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subcategoryId, type, quantity, notes } = parsed.data;

  const [subcategory] = await db
    .select()
    .from(subcategoriesTable)
    .where(eq(subcategoriesTable.id, subcategoryId));

  if (!subcategory) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  if (type === "OUT" && subcategory.currentStock < quantity) {
    res.status(400).json({ error: "Insufficient stock" });
    return;
  }

  const newStock = type === "IN"
    ? subcategory.currentStock + quantity
    : subcategory.currentStock - quantity;

  await db
    .update(subcategoriesTable)
    .set({ currentStock: newStock })
    .where(eq(subcategoriesTable.id, subcategoryId));

  const [transaction] = await db
    .insert(transactionsTable)
    .values({
      subcategoryId,
      type,
      quantity,
      notes: notes ?? null,
      userId: req.user!.userId,
    })
    .returning();

  res.status(201).json(transaction);
});

router.get("/transactions/recent", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      subcategoryId: transactionsTable.subcategoryId,
      subcategoryName: subcategoriesTable.name,
      categoryName: categoriesTable.name,
      unit: categoriesTable.unit,
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
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);

  res.json(rows);
});

export default router;

import { Router, type IRouter } from "express";
import { db, categoriesTable, subcategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../lib/auth";
import { CreateCategoryBody, CreateSubcategoryBody, DeleteCategoryParams, DeleteSubcategoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const subcategories = await db.select().from(subcategoriesTable).orderBy(subcategoriesTable.name);

  const result = categories.map((cat) => ({
    ...cat,
    subcategories: subcategories.filter((sub) => sub.categoryId === cat.id),
  }));

  res.json(result);
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db.insert(categoriesTable).values({ name: parsed.data.name }).returning();
  res.status(201).json({ ...category, subcategories: [] });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/subcategories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSubcategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, parsed.data.categoryId));
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [subcategory] = await db
    .insert(subcategoriesTable)
    .values({ name: parsed.data.name, categoryId: parsed.data.categoryId })
    .returning();

  res.status(201).json(subcategory);
});

router.delete("/subcategories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteSubcategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(subcategoriesTable).where(eq(subcategoriesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

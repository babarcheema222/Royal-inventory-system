import { Router, type IRouter } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../lib/auth";
import { CreateSupplierBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/suppliers", requireAuth, async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers);
});

router.post("/suppliers", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db.insert(suppliersTable).values({
    name: parsed.data.name,
    contactInfo: parsed.data.contactInfo || null
  }).returning();

  res.status(201).json(supplier);
});

export default router;

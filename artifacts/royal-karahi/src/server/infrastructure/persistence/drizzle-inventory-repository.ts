import { eq, sql, lt, and, gte, lte, desc } from "drizzle-orm";
import { type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@workspace/db/schema";
import { IInventoryRepository } from "../../domain/repositories/inventory-repository.interface";
import { Category, Subcategory, Transaction, InventorySummary } from "../../domain/entities/inventory";

export class DrizzleInventoryRepository implements IInventoryRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getCategories(): Promise<Category[]> {
    const categories = await this.db.select().from(schema.categoriesTable).orderBy(schema.categoriesTable.name);
    const subcategories = await this.db.select().from(schema.subcategoriesTable).orderBy(schema.subcategoriesTable.name);
    
    return categories.map(cat => ({
      ...cat,
      subcategories: subcategories.filter(sub => sub.categoryId === cat.id)
    }));
  }

  async createCategory(data: { name: string; unit: string }): Promise<Category> {
    const [category] = await this.db.insert(schema.categoriesTable).values(data).returning();
    return category;
  }

  async updateCategory(id: number, name: string): Promise<void> {
    await this.db.update(schema.categoriesTable)
      .set({ name })
      .where(eq(schema.categoriesTable.id, id));
  }

  async deleteCategory(id: number): Promise<void> {
    await this.db.delete(schema.categoriesTable).where(eq(schema.categoriesTable.id, id));
  }

  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    const query = this.db.select().from(schema.subcategoriesTable);
    if (categoryId) {
      query.where(eq(schema.subcategoriesTable.categoryId, categoryId));
    }
    return query.orderBy(schema.subcategoriesTable.name);
  }

  async createSubcategory(data: { name: string; categoryId: number }): Promise<Subcategory> {
    const [sub] = await this.db.insert(schema.subcategoriesTable).values(data).returning();
    return sub;
  }

  async updateSubcategory(id: number, name: string): Promise<void> {
    await this.db.update(schema.subcategoriesTable)
      .set({ name })
      .where(eq(schema.subcategoriesTable.id, id));
  }

  async deleteSubcategory(id: number): Promise<void> {
    await this.db.delete(schema.subcategoriesTable).where(eq(schema.subcategoriesTable.id, id));
  }

  async getInventorySummary(): Promise<InventorySummary> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalItemsRow,
      lowStockRow,
      totalCategoriesRow,
      todayTransactionsRow
    ] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.subcategoriesTable)
        .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id)),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.subcategoriesTable)
        .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id))
        .where(lt(schema.subcategoriesTable.currentStock, 5)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.categoriesTable),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.transactionsTable)
        .where(and(gte(schema.transactionsTable.createdAt, last24h), eq(schema.transactionsTable.isCleared, false)))
    ]);

    return {
      totalItems: totalItemsRow[0]?.count ?? 0,
      lowStockCount: lowStockRow[0]?.count ?? 0,
      totalCategories: totalCategoriesRow[0]?.count ?? 0,
      totalTransactionsToday: todayTransactionsRow[0]?.count ?? 0,
    };
  }

  async listInventory(search?: string, limit: number = 1000, offset: number = 0): Promise<(Subcategory & { categoryName: string; unit: string; isLowStock: boolean })[]> {
    const s = search ? `%${search.toLowerCase()}%` : null;

    const result = await this.db
      .select({
        id: schema.subcategoriesTable.id,
        name: schema.subcategoriesTable.name,
        categoryId: schema.subcategoriesTable.categoryId,
        currentStock: schema.subcategoriesTable.currentStock,
        createdAt: schema.subcategoriesTable.createdAt,
        categoryName: schema.categoriesTable.name,
        unit: schema.categoriesTable.unit,
      })
      .from(schema.subcategoriesTable)
      .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id))
      .where(s ? sql`LOWER(${schema.subcategoriesTable.name}) LIKE ${s} OR LOWER(${schema.categoriesTable.name}) LIKE ${s}` : undefined)
      .orderBy(schema.categoriesTable.name, schema.subcategoriesTable.name)
      .limit(limit)
      .offset(offset);

    return result.map(item => ({
      ...item,
      isLowStock: item.currentStock < 5
    }));
  }

  async getLowStockItems(): Promise<(Subcategory & { categoryName: string; unit: string; isLowStock: boolean })[]> {
    const result = await this.db
      .select({
        id: schema.subcategoriesTable.id,
        name: schema.subcategoriesTable.name,
        categoryId: schema.subcategoriesTable.categoryId,
        currentStock: schema.subcategoriesTable.currentStock,
        createdAt: schema.subcategoriesTable.createdAt,
        categoryName: schema.categoriesTable.name,
        unit: schema.categoriesTable.unit,
      })
      .from(schema.subcategoriesTable)
      .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id))
      .where(lt(schema.subcategoriesTable.currentStock, 5))
      .orderBy(schema.categoriesTable.name, schema.subcategoriesTable.name);

    return result.map(item => ({
      ...item,
      isLowStock: true
    }));
  }

  async getTransactions(from: Date, to: Date, limit: number = 100, offset: number = 0): Promise<(Transaction & { subcategoryName: string; categoryName: string; unit: string; username: string })[]> {
    const results = await this.db
      .select({
        id: schema.transactionsTable.id,
        subcategoryId: schema.transactionsTable.subcategoryId,
        itemName: schema.transactionsTable.itemName,
        subcategoryName: schema.transactionsTable.subcategoryName,
        categoryName: schema.transactionsTable.categoryName,
        unit: schema.transactionsTable.unit,
        type: schema.transactionsTable.type,
        quantity: schema.transactionsTable.quantity,
        notes: schema.transactionsTable.notes,
        isCleared: schema.transactionsTable.isCleared,
        userId: schema.transactionsTable.userId,
        createdAt: schema.transactionsTable.createdAt,
        username: schema.usersTable.username,
      })
      .from(schema.transactionsTable)
      .innerJoin(schema.usersTable, eq(schema.transactionsTable.userId, schema.usersTable.id))
      .where(and(
        gte(schema.transactionsTable.createdAt, from), 
        lte(schema.transactionsTable.createdAt, to),
        eq(schema.transactionsTable.isCleared, false)
      ))
      .orderBy(desc(schema.transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Map snapshot fields to the expected interface format
    return results.map(row => ({
      ...row,
      subcategoryName: row.subcategoryName,
      categoryName: row.categoryName,
      unit: row.unit
    })) as any;
  }

  async createTransaction(data: { subcategoryId: number; type: "IN" | "OUT"; quantity: number; notes?: string | null; userId: number }): Promise<Transaction> {
    // 0. Fetch metadata for snapshotting
    const [itemData] = await this.db
      .select({
        subcategoryName: schema.subcategoriesTable.name,
        categoryName: schema.categoriesTable.name,
        unit: schema.categoriesTable.unit,
      })
      .from(schema.subcategoriesTable)
      .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id))
      .where(eq(schema.subcategoriesTable.id, data.subcategoryId));

    if (!itemData) {
      throw new Error("Subcategory not found.");
    }

    // 1. Calculate the change as a positive or negative number
    const quantityChange = data.type === "IN" ? data.quantity : -data.quantity;
    
    // 2. Update the stock level atomically
    const updateResult = await this.db
      .update(schema.subcategoriesTable)
      .set({ 
        currentStock: sql`ROUND((${schema.subcategoriesTable.currentStock} + ${quantityChange})::numeric, 2)::double precision` 
      })
      .where(and(
        eq(schema.subcategoriesTable.id, data.subcategoryId),
        data.type === "OUT" 
          ? gte(schema.subcategoriesTable.currentStock, data.quantity)
          : undefined
      ));

    if (updateResult.rowCount === 0 && data.type === "OUT") {
      throw new Error("Insufficient stock to complete this transaction.");
    }

    // 3. Record the transaction with snapshots
    const [transaction] = await this.db.insert(schema.transactionsTable).values({
      ...data,
      itemName: itemData.subcategoryName, // Capture itemName as subcategory name
      subcategoryName: itemData.subcategoryName,
      categoryName: itemData.categoryName,
      unit: itemData.unit,
      isCleared: false,
    }).returning();

    return transaction;
  }

  async clearAllHistory(): Promise<void> {
    await this.db
      .update(schema.transactionsTable)
      .set({ isCleared: true })
      .where(eq(schema.transactionsTable.isCleared, false));
  }
}

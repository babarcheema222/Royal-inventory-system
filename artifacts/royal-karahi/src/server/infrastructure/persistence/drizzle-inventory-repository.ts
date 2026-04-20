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
        .where(lt(schema.subcategoriesTable.currentStock, 10)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.categoriesTable),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.transactionsTable).where(gte(schema.transactionsTable.createdAt, last24h))
    ]);

    return {
      totalItems: totalItemsRow[0]?.count ?? 0,
      lowStockCount: lowStockRow[0]?.count ?? 0,
      totalCategories: totalCategoriesRow[0]?.count ?? 0,
      totalTransactionsToday: todayTransactionsRow[0]?.count ?? 0,
    };
  }

  async listInventory(search?: string, limit: number = 50, offset: number = 0): Promise<(Subcategory & { categoryName: string; unit: string; isLowStock: boolean })[]> {
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
      isLowStock: item.currentStock < 10
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
      .where(lt(schema.subcategoriesTable.currentStock, 10))
      .orderBy(schema.categoriesTable.name, schema.subcategoriesTable.name);

    return result.map(item => ({
      ...item,
      isLowStock: true
    }));
  }

  async getTransactions(from: Date, to: Date, limit: number = 100, offset: number = 0): Promise<(Transaction & { subcategoryName: string; categoryName: string; unit: string; username: string })[]> {
    return this.db
      .select({
        id: schema.transactionsTable.id,
        subcategoryId: schema.transactionsTable.subcategoryId,
        type: schema.transactionsTable.type,
        quantity: schema.transactionsTable.quantity,
        notes: schema.transactionsTable.notes,
        userId: schema.transactionsTable.userId,
        createdAt: schema.transactionsTable.createdAt,
        subcategoryName: schema.subcategoriesTable.name,
        categoryName: schema.categoriesTable.name,
        unit: schema.categoriesTable.unit,
        username: schema.usersTable.username,
      })
      .from(schema.transactionsTable)
      .innerJoin(schema.subcategoriesTable, eq(schema.transactionsTable.subcategoryId, schema.subcategoriesTable.id))
      .innerJoin(schema.categoriesTable, eq(schema.subcategoriesTable.categoryId, schema.categoriesTable.id))
      .innerJoin(schema.usersTable, eq(schema.transactionsTable.userId, schema.usersTable.id))
      .where(and(gte(schema.transactionsTable.createdAt, from), lte(schema.transactionsTable.createdAt, to)))
      .orderBy(desc(schema.transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createTransaction(data: { subcategoryId: number; type: "IN" | "OUT"; quantity: number; notes?: string | null; userId: number }): Promise<Transaction> {
    // Calculate the change as a positive or negative number
    const quantityChange = data.type === "IN" ? data.quantity : -data.quantity;
    
    // Update the stock level atomically using SQL template literal
    // 1. We use ROUND(..., 2) to fix floating point precision issues
    // 2. We use '::numeric' for reliable rounding in Postgres
    // 3. The 'where' clause ensures we don't drop below 0 if it's an "OUT" transaction
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

    // If no rows were updated, it means the stock was insufficient (or item not found)
    if (updateResult.rowCount === 0 && data.type === "OUT") {
      throw new Error("Insufficient stock to complete this transaction.");
    }

    // Record the transaction only if the stock update was successful
    const [transaction] = await this.db.insert(schema.transactionsTable).values(data).returning();

    return transaction;
  }
}

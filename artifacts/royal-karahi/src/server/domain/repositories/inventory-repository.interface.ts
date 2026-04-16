import { Category, Subcategory, Transaction, InventorySummary, MetadataHistory } from "../entities/inventory";

export interface IInventoryRepository {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: { name: string; unit: string }): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Subcategories
  getSubcategories(categoryId?: number): Promise<Subcategory[]>;
  createSubcategory(data: { name: string; categoryId: number }): Promise<Subcategory>;
  deleteSubcategory(id: number): Promise<void>;

  // Inventory
  getInventorySummary(): Promise<InventorySummary>;
  listInventory(search?: string, limit?: number, offset?: number): Promise<(Subcategory & { categoryName: string; unit: string; isLowStock: boolean })[]>;
  getLowStockItems(): Promise<(Subcategory & { categoryName: string; unit: string; isLowStock: boolean })[]>;

  // Transactions
  getTransactions(from: Date, to: Date, limit?: number, offset?: number): Promise<(Transaction & { subcategoryName: string; categoryName: string; unit: string; username: string })[]>;
  createTransaction(data: { subcategoryId: number; type: "IN" | "OUT"; quantity: number; notes?: string | null; userId: number }): Promise<Transaction>;

  // Metadata History
  logMetadataEvent(data: { entityType: string; entityName: string; action: string; userId: number }): Promise<void>;
  getMetadataHistory(limit?: number, offset?: number): Promise<MetadataHistory[]>;
}

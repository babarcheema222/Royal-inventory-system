import { serverCache } from "../infrastructure/cache";
import { IInventoryRepository } from "../domain/repositories/inventory-repository.interface";
import { InventorySummary } from "../domain/entities/inventory";

export class InventoryService {
  constructor(private repository: IInventoryRepository) {}

  async getDashboardSummary(): Promise<InventorySummary> {
    const cacheKey = "dashboard:summary";
    const cached = await serverCache.get<InventorySummary>(cacheKey);
    if (cached) return cached;

    const summary = await this.repository.getInventorySummary();
    await serverCache.set(cacheKey, summary, 60000); // 60s cache
    return summary;
  }

  async listInventory(search?: string, limit?: number, offset?: number) {
    return this.repository.listInventory(search, limit, offset);
  }

  async getLowStock() {
    return this.repository.getLowStockItems();
  }

  async getCategories() {
    return this.repository.getCategories();
  }

  async createCategory(name: string, unit: string, userId: number) {
    const category = await this.repository.createCategory({ name, unit });
    await this.repository.logMetadataEvent({
      entityType: "CATEGORY",
      entityName: name,
      action: "CREATE",
      userId
    });
    return category;
  }

  async deleteCategory(id: number, userId: number) {
    // Get name before deletion
    const categories = await this.repository.getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    await this.repository.deleteCategory(id);
    await this.repository.logMetadataEvent({
      entityType: "CATEGORY",
      entityName: cat.name,
      action: "DELETE",
      userId
    });
  }

  async getSubcategories(categoryId?: number) {
    return this.repository.getSubcategories(categoryId);
  }

  async createSubcategory(name: string, categoryId: number, userId: number) {
    const sub = await this.repository.createSubcategory({ name, categoryId });
    await this.repository.logMetadataEvent({
      entityType: "SUBCATEGORY",
      entityName: name,
      action: "CREATE",
      userId
    });
    return sub;
  }

  async deleteSubcategory(id: number, userId: number) {
    // Get name before deletion
    const items = await this.repository.listInventory();
    const item = items.find(i => i.id === id);
    if (!item) return;

    await this.repository.deleteSubcategory(id);
    await this.repository.logMetadataEvent({
      entityType: "SUBCATEGORY",
      entityName: item.name,
      action: "DELETE",
      userId
    });
  }

  async getTransactions(from: Date, to: Date, limit?: number, offset?: number) {
    return this.repository.getTransactions(from, to, limit, offset);
  }

  async logTransaction(data: { subcategoryId: number; type: "IN" | "OUT"; quantity: number; notes?: string | null; userId: number }) {
    return this.repository.createTransaction(data);
  }

  async getMetadataHistory(limit?: number, offset?: number) {
    return this.repository.getMetadataHistory(limit, offset);
  }
}

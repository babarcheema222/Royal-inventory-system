import { IInventoryRepository } from "../domain/repositories/inventory-repository.interface";

export class InventoryService {
  constructor(private repository: IInventoryRepository) {}

  async getDashboardSummary() {
    return this.repository.getInventorySummary();
  }

  async listInventory(search?: string) {
    return this.repository.listInventory(search);
  }

  async getLowStock() {
    return this.repository.getLowStockItems();
  }

  async getCategories() {
    return this.repository.getCategories();
  }

  async createCategory(name: string, unit: string) {
    return this.repository.createCategory({ name, unit });
  }

  async deleteCategory(id: number) {
    return this.repository.deleteCategory(id);
  }

  async getSubcategories(categoryId?: number) {
    return this.repository.getSubcategories(categoryId);
  }

  async createSubcategory(name: string, categoryId: number) {
    return this.repository.createSubcategory({ name, categoryId });
  }

  async deleteSubcategory(id: number) {
    return this.repository.deleteSubcategory(id);
  }

  async getTransactions(from: Date, to: Date) {
    return this.repository.getTransactions(from, to);
  }

  async logTransaction(data: { subcategoryId: number; type: "IN" | "OUT"; quantity: number; notes?: string | null; userId: number }) {
    return this.repository.createTransaction(data);
  }
}

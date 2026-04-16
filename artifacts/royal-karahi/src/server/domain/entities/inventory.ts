export interface Category {
  id: number;
  name: string;
  unit: string;
  createdAt: Date;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  currentStock: number;
  createdAt: Date;
}

export interface Transaction {
  id: number;
  subcategoryId: number;
  type: "IN" | "OUT";
  quantity: number;
  notes: string | null;
  userId: number;
  createdAt: Date;
}

export interface InventorySummary {
  totalItems: number;
  lowStockCount: number;
  totalCategories: number;
  totalTransactionsToday: number;
}

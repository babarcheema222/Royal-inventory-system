import { pgTable, text, serial, integer, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull().default("Kg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index("categories_name_idx").on(table.name),
}));

export const subcategoriesTable = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  currentStock: doublePrecision("current_stock").notNull().default(0),
  lowStockThreshold: doublePrecision("low_stock_threshold").notNull().default(0),
  costPerUnit: doublePrecision("cost_per_unit").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  catIdIdx: index("subcat_cat_id_idx").on(table.categoryId),
  createdIdx: index("subcat_created_idx").on(table.createdAt),
}));

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

export const insertSubcategorySchema = createInsertSchema(subcategoriesTable).omit({ id: true, createdAt: true, currentStock: true });
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategoriesTable.$inferSelect;

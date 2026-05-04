import { pgTable, text, serial, integer, timestamp, doublePrecision, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { subcategoriesTable } from "./categories";

export const demandsTable = pgTable("demands", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  requesterName: text("requester_name").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index("demand_user_idx").on(table.userId),
  createdIdx: index("demand_created_idx").on(table.createdAt),
}));

export const demandItemsTable = pgTable("demand_items", {
  id: serial("id").primaryKey(),
  demandId: integer("demand_id").notNull().references(() => demandsTable.id, { onDelete: "cascade" }),
  subcategoryId: integer("subcategory_id").references(() => subcategoriesTable.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  categoryName: text("category_name").notNull(),
  unit: text("unit").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  currentStock: doublePrecision("current_stock"),
  comment: text("comment"),
  isCustom: boolean("is_custom").notNull().default(false),
}, (table) => ({
  demandIdx: index("demand_item_demand_idx").on(table.demandId),
}));

export const insertDemandSchema = createInsertSchema(demandsTable).omit({ id: true, createdAt: true });
export type InsertDemand = z.infer<typeof insertDemandSchema>;
export type Demand = typeof demandsTable.$inferSelect;

export const insertDemandItemSchema = createInsertSchema(demandItemsTable).omit({ id: true });
export type InsertDemandItem = z.infer<typeof insertDemandItemSchema>;
export type DemandItem = typeof demandItemsTable.$inferSelect;

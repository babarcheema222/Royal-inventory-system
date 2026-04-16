import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const inventoryHistoryTable = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'CATEGORY' | 'SUBCATEGORY'
  entityName: text("entity_name").notNull(),
  action: text("action").notNull(), // 'CREATE' | 'DELETE'
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InventoryHistory = typeof inventoryHistoryTable.$inferSelect;
export type InsertInventoryHistory = typeof inventoryHistoryTable.$inferInsert;

import { pgTable, text, serial, integer, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subcategoriesTable } from "./categories";
import { usersTable } from "./users";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  subcategoryId: integer("subcategory_id").notNull().references(() => subcategoriesTable.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["IN", "OUT"] }).notNull(),
  quantity: doublePrecision("quantity").notNull(),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  subcatIdx: index("tx_subcat_idx").on(table.subcategoryId),
  userIdx: index("tx_user_idx").on(table.userId),
  createdIdx: index("tx_created_idx").on(table.createdAt),
}));

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

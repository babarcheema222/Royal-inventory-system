import { pgTable, text, serial, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
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
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { DrizzleInventoryRepository } from "@/server/infrastructure/persistence/drizzle-inventory-repository";
import { InventoryService } from "@/server/application/inventory-service";

const getService = (db: any) => {
  const repo = new DrizzleInventoryRepository(db);
  return new InventoryService(repo);
};

export const inventoryRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getDashboardSummary();
  }),

  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).listInventory(input.search);
    }),

  getLowStock: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getLowStock();
  }),

  // Categories
  getCategories: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getCategories();
  }),

  createCategory: adminProcedure
    .input(z.object({ name: z.string(), unit: z.string() }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).createCategory(input.name, input.unit);
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).deleteCategory(input.id);
    }),

  // Subcategories
  getSubcategories: protectedProcedure
    .input(z.object({ categoryId: z.number().optional() }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).getSubcategories(input.categoryId);
    }),

  createSubcategory: adminProcedure
    .input(z.object({ name: z.string(), categoryId: z.number() }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).createSubcategory(input.name, input.categoryId);
    }),

  deleteSubcategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).deleteSubcategory(input.id);
    }),

  getRecentTransactions: protectedProcedure.query(({ ctx }) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30); // Last 30 days
    return getService(ctx.db).getTransactions(from, to);
  }),

  // Transactions
  getTransactions: protectedProcedure
    .input(z.object({ from: z.date(), to: z.date() }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).getTransactions(input.from, input.to);
    }),

  logTransaction: protectedProcedure
    .input(z.object({ 
      subcategoryId: z.number(), 
      type: z.enum(["IN", "OUT"]), 
      quantity: z.number(), 
      notes: z.string().nullish() 
    }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).logTransaction({
        ...input,
        userId: Number(ctx.session.user.id)
      });
    }),
});

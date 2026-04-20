import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure, superAdminProcedure } from "@/server/api/trpc";
import { DrizzleInventoryRepository } from "@/server/infrastructure/persistence/drizzle-inventory-repository";
import { InventoryService } from "@/server/application/inventory-service";
import { ProductionLogger } from "@/lib/error-handler";

const getService = (db: any) => {
  const repo = new DrizzleInventoryRepository(db);
  return new InventoryService(repo);
};

export const inventoryRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getDashboardSummary();
  }),

  list: protectedProcedure
    .input(z.object({ 
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).listInventory(input.search, input.limit, input.offset);
    }),

  getLowStock: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getLowStock();
  }),

  // Categories
  getCategories: protectedProcedure.query(({ ctx }) => {
    return getService(ctx.db).getCategories();
  }),

  createCategory: managerProcedure
    .input(z.object({ name: z.string(), unit: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ProductionLogger.info(`[Audit] Category creation by ${ctx.session.user.role}:${ctx.session.user.id}`, {
        userId: ctx.session.user.id,
        metadata: { name: input.name, unit: input.unit }
      });
      return getService(ctx.db).createCategory(input.name, input.unit);
    }),

  deleteCategory: managerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ProductionLogger.info(`[Audit] Category deletion by ${ctx.session.user.role}:${ctx.session.user.id}`, {
        userId: ctx.session.user.id,
        metadata: { categoryId: input.id }
      });
      return getService(ctx.db).deleteCategory(input.id);
    }),

  // Subcategories
  getSubcategories: protectedProcedure
    .input(z.object({ categoryId: z.number().optional() }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).getSubcategories(input.categoryId);
    }),

  createSubcategory: managerProcedure
    .input(z.object({ name: z.string(), categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ProductionLogger.info(`[Audit] Subcategory creation by ${ctx.session.user.role}:${ctx.session.user.id}`, {
        userId: ctx.session.user.id,
        metadata: { name: input.name, categoryId: input.categoryId }
      });
      return getService(ctx.db).createSubcategory(input.name, input.categoryId);
    }),

  deleteSubcategory: managerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ProductionLogger.info(`[Audit] Subcategory deletion by ${ctx.session.user.role}:${ctx.session.user.id}`, {
        userId: ctx.session.user.id,
        metadata: { subcategoryId: input.id }
      });
      return getService(ctx.db).deleteSubcategory(input.id);
    }),

  getRecentTransactions: protectedProcedure.query(({ ctx }) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30); // Last 30 days
    return getService(ctx.db).getTransactions(from, to, 10, 0); // Default 10 for dashboard
  }),

  // Transactions
  getTransactions: protectedProcedure
    .input(z.object({ 
      from: z.date(), 
      to: z.date(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }))
    .query(({ ctx, input }) => {
      return getService(ctx.db).getTransactions(input.from, input.to, input.limit, input.offset);
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

  clearHistory: superAdminProcedure
    .mutation(async ({ ctx }) => {
      ProductionLogger.info(`[Audit] History cleared by Super Admin:${ctx.session.user.id}`, {
        userId: ctx.session.user.id
      });
      return getService(ctx.db).clearHistory();
    }),
});

import { z } from "zod";
import { createTRPCRouter, managerProcedure, adminProcedure } from "@/server/api/trpc";
import { demandsTable, demandItemsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

export const demandRouter = createTRPCRouter({
  create: managerProcedure
    .input(z.object({
      items: z.array(z.object({
        subcategoryId: z.number().optional(),
        itemName: z.string(),
        categoryName: z.string(),
        unit: z.string(),
        quantity: z.number(),
        currentStock: z.number().optional(),
        comment: z.string().optional(),
        isCustom: z.boolean().default(false),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create main demand record
      const [demand] = await ctx.db.insert(demandsTable).values({
        userId: Number(ctx.session.user.id),
        requesterName: ctx.session.user.name || "Unknown",
        status: "Pending",
        createdAt: new Date(),
      }).returning();

      if (!demand) throw new Error("Failed to create demand header");

      // 2. Create demand items records
      if (input.items.length > 0) {
        await ctx.db.insert(demandItemsTable).values(
          input.items.map(item => ({
            demandId: demand.id,
            subcategoryId: item.subcategoryId,
            itemName: item.itemName,
            categoryName: item.categoryName,
            unit: item.unit,
            quantity: item.quantity,
            currentStock: item.currentStock,
            comment: item.comment,
            isCustom: item.isCustom,
          }))
        );
      }

      return demand;
    }),

  list: managerProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.demandsTable.findMany({
      orderBy: [desc(demandsTable.createdAt)],
      with: {
        // We might need to add relations in schema for this to work elegantly
        // For now, we'll just return the headers and fetch items when needed
      }
    });
  }),

  getById: managerProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const demand = await ctx.db.query.demandsTable.findFirst({
        where: eq(demandsTable.id, input.id),
      });

      if (!demand) return null;

      const items = await ctx.db.query.demandItemsTable.findMany({
        where: eq(demandItemsTable.demandId, input.id),
      });

      return {
        ...demand,
        items,
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(demandsTable).where(eq(demandsTable.id, input.id));
    }),
});

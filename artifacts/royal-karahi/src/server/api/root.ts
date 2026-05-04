import { createTRPCRouter } from "@/server/api/trpc";
import { inventoryRouter } from "./routers/inventory";
import { userRouter } from "./routers/user";
import { demandRouter } from "./routers/demand";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  inventory: inventoryRouter,
  user: userRouter,
  demand: demandRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

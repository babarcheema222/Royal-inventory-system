import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "@/server/api/trpc";
import { UserService } from "@/server/application/user-service";

const getService = (db: any) => new UserService(db);

export const userRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => {
    return getService(ctx.db).listUsers();
  }),

  create: adminProcedure
    .input(z.object({ 
      username: z.string(), 
      password: z.string(), 
      role: z.enum(["admin", "user", "manager"]) 
    }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      return getService(ctx.db).createUser({
        username: input.username,
        passwordHash,
        passwordPlain: input.password,
        role: input.role
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return getService(ctx.db).deleteUser(input.id);
    }),

  updatePassword: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      password: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      return getService(ctx.db).updateUser(input.id, {
        passwordHash,
        passwordPlain: input.password
      });
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),
});

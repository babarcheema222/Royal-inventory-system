import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/server/auth";
import { db } from "@workspace/db";
import { ProductionLogger } from "@/lib/error-handler";
import { checkRateLimit } from "./rate-limiter";
import { getFeatureFlag } from "@/utils/flags";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const session = await auth();
  const ip = opts.req.headers.get("x-forwarded-for") || "127.0.0.1";

  return {
    db,
    session,
    ip,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    // Log all errors in production
    ProductionLogger.error(`[tRPC Error] ${error.code}: ${error.message}`, {
      userId: ctx?.session?.user?.id,
      route: shape.data?.path,
      metadata: { error: error.name, cause: error.cause }
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. MIDDLEWARE
 */

// Advanced Observability Middleware (Sampling + Latency)
const observabilityMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  // Log Sampling: 1/10 requests in production for successful GETs
  // Always log errors and non-GET requests (mutations)
  const isProd = process.env.NODE_ENV === "production";
  const shouldLog = !isProd || type === "mutation" || Math.random() < 0.1;

  if (shouldLog) {
    ProductionLogger.info(`[tRPC] ${type} ${path} - ${duration}ms`, {
      userId: ctx.session?.user?.id,
      route: path,
      metadata: { duration, type }
    });
  }

  return result;
});

// Rate Limiting Middleware
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  if (!getFeatureFlag("ENABLE_RATE_LIMIT")) return next();

  // Limit by IP
  const ipLimit = checkRateLimit(ctx.ip, "ip", { windowMs: 10000, max: 20 });
  if (!ipLimit.success) {
    throw new TRPCError({ 
      code: "TOO_MANY_REQUESTS", 
      message: `Too many requests from this IP. Please try again in ${Math.ceil(ipLimit.reset / 1000)}s.` 
    });
  }

  // Limit by User (more restrictive)
  if (ctx.session?.user?.id) {
    const userLimit = checkRateLimit(String(ctx.session.user.id), "user", { windowMs: 10000, max: 10 });
    if (!userLimit.success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "User rate limit exceeded." });
    }
  }

  return next();
});

/**
 * 4. ROUTER & PROCEDURE ADAPTERS
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure
  .use(observabilityMiddleware)
  .use(rateLimitMiddleware);

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(observabilityMiddleware)
  .use(rateLimitMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Generic Role-based procedure factory
 */
export const roleProcedure = (roles: string[]) => 
  protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.session.user.role)) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: `Insufficient permissions. Required roles: ${roles.join(", ")}` 
      });
    }
    return next();
  });

/**
 * Admin procedure (Strictly Admin)
 */
export const adminProcedure = roleProcedure(["admin"]);

/**
 * Super Admin procedure (Admin + Super Admin privilege)
 */
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin" || !ctx.session.user.isSuperAdmin) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Insufficient permissions. Requires Super Admin privileges." 
    });
  }
  return next();
});

/**
 * Manager procedure (Admin or Manager)
 */
export const managerProcedure = roleProcedure(["admin", "manager"]);

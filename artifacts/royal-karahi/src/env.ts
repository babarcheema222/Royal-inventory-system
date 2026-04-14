import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const issues = _env.error.flatten().fieldErrors;
  const missingKeys = Object.keys(issues).join(", ");
  
  const errorMessage = `❌ [ENV VALIDATION ERROR] Missing or invalid environment variables: ${missingKeys}`;
  
  if (process.env.NODE_ENV === "production") {
    console.error(errorMessage);
    throw new Error(errorMessage);
  } else {
    // In development, we warn instead of crashing to avoid blocking setup
    console.warn(errorMessage);
    console.warn("⚠️ Continuing in Development Mode despite missing ENV keys.");
  }
}

export const env = _env.success ? _env.data : process.env as unknown as z.infer<typeof envSchema>;

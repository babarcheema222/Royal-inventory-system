import { defineConfig } from "drizzle-kit";
import "dotenv/config";

declare const process: { env: Record<string, string | undefined> };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: true,
  },
});

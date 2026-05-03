import { neon } from "@neondatabase/serverless";

const sql = neon('postgresql://neondb_owner:npg_qgTL90IHbnKV@ep-wild-sunset-am1xeofg-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log("Adding remaining_stock column...");
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS remaining_stock DOUBLE PRECISION`;
    console.log("Column added successfully.");
  } catch (err) {
    console.error("Failed to add column:", err);
  }
}

main();

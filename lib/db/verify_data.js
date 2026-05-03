import { neon } from "@neondatabase/serverless";

const sql = neon('postgresql://neondb_owner:npg_qgTL90IHbnKV@ep-wild-sunset-am1xeofg-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    const result = await sql`
      SELECT id, subcategory_name, remaining_stock 
      FROM transactions 
      WHERE remaining_stock IS NOT NULL 
      LIMIT 10
    `;
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();

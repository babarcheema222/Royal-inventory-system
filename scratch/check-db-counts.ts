
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../artifacts/royal-karahi/src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../artifacts/royal-karahi/.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function checkCounts() {
  const categories = await db.select().from(schema.categoriesTable);
  const subcategories = await db.select().from(schema.subcategoriesTable);
  
  console.log('Categories Count:', categories.length);
  console.log('Subcategories Count:', subcategories.length);
  
  if (subcategories.length > 0) {
    console.log('Sample Subcategory:', subcategories[0]);
  }
}

checkCounts().catch(console.error);

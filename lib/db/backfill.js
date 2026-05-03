import { neon } from "@neondatabase/serverless";

const sql = neon('postgresql://neondb_owner:npg_qgTL90IHbnKV@ep-wild-sunset-am1xeofg-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log("Starting backfill...");
    
    // 1. Get all subcategories and their current stock
    const subcategories = await sql`SELECT id, current_stock FROM subcategories`;
    
    for (const sub of subcategories) {
      console.log(`Processing subcategory ${sub.id}...`);
      
      // 2. Get all uncleared transactions for this subcategory, sorted by date DESC
      const transactions = await sql`
        SELECT id, type, quantity 
        FROM transactions 
        WHERE subcategory_id = ${sub.id} AND is_cleared = false
        ORDER BY created_at DESC
      `;
      
      let runningStock = sub.current_stock;
      
      for (const tx of transactions) {
        // Update this transaction's remaining_stock
        await sql`
          UPDATE transactions 
          SET remaining_stock = ${runningStock} 
          WHERE id = ${tx.id}
        `;
        
        // Adjust running stock for the *previous* transaction
        if (tx.type === 'IN') {
          runningStock -= tx.quantity;
        } else {
          runningStock += tx.quantity;
        }
      }
    }
    
    console.log("Backfill completed successfully.");
  } catch (err) {
    console.error("Backfill failed:", err);
  }
}

main();

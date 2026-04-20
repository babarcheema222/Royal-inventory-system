import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function seedAdmin() {
  const targetUsername = "Royal";
  const oldUsernames = ["admin", "Royalkarahi"];
  const password = "Admin786";
  const role = "admin";

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Check for the target user
  const targetUserRes = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [targetUsername]
  );
  
  // 2. Check for old users
  const oldUsersRes = await pool.query(
    "SELECT id, username FROM users WHERE username = ANY($1)",
    [oldUsernames]
  );

  if (targetUserRes.rows.length > 0 && oldUsersRes.rows.length > 0) {
    // Both exist! We need to consolidate.
    // We'll keep the one with history (usually the old one, ID 1)
    // But since we can't easily merge history without knowing all tables, 
    // let's just delete the new 'Royal' and rename the old one.
    
    const targetId = targetUserRes.rows[0].id;
    const oldId = oldUsersRes.rows[0].id;
    const oldName = oldUsersRes.rows[0].username;

    console.log(`Consolidating accounts: Deleting new "${targetUsername}" (id: ${targetId}) and renaming "${oldName}" (id: ${oldId}) to "${targetUsername}"`);
    
    await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
    await pool.query(
      "UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4",
      [targetUsername, passwordHash, role, oldId]
    );

    console.log("✅ Admin accounts consolidated successfully.");
    return;
  }

  if (oldUsersRes.rows.length > 0) {
    const oldId = oldUsersRes.rows[0].id;
    const oldName = oldUsersRes.rows[0].username;
    console.log(`Renaming existing user "${oldName}" (id: ${oldId}) to "${targetUsername}"`);
    await pool.query(
      "UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4",
      [targetUsername, passwordHash, role, oldId]
    );
    console.log("✅ Admin user updated successfully.");
    return;
  }

  if (targetUserRes.rows.length > 0) {
    const targetId = targetUserRes.rows[0].id;
    console.log(`Updating existing user "${targetUsername}" (id: ${targetId})`);
    await pool.query(
      "UPDATE users SET password_hash = $2, role = $3 WHERE id = $1",
      [targetId, passwordHash, role]
    );
    console.log("✅ Admin user updated successfully.");
    return;
  }

  // Create new
  const result = await pool.query(
    "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
    [targetUsername, passwordHash, role]
  );

  console.log("✅ Admin user created successfully:");
  console.log(`   Username: ${targetUsername}`);
  console.log(`   ID: ${result.rows[0].id}`);

  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});

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
  const username = "admin";
  const password = "admin123";
  const role = "admin";

  // Check if admin user already exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );

  if (existing.rows.length > 0) {
    console.log(`Admin user "${username}" already exists (id: ${existing.rows[0].id})`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role",
    [username, passwordHash, role]
  );

  console.log("✅ Admin user created successfully:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${role}`);
  console.log(`   ID: ${result.rows[0].id}`);

  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});

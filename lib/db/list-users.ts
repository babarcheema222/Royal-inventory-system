import { db } from "./src/index.ts";
import { usersTable } from "./src/schema/users.ts";

async function main() {
  const users = await db.select().from(usersTable);
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

main().catch(console.error);

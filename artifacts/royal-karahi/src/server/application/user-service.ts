import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@workspace/db/schema";

export class UserService {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async listUsers() {
    return this.db
      .select({
        id: schema.usersTable.id,
        username: schema.usersTable.username,
        role: schema.usersTable.role,
        createdAt: schema.usersTable.createdAt,
      })
      .from(schema.usersTable)
      .orderBy(schema.usersTable.createdAt);
  }

  async createUser(data: { username: string; passwordHash: string; role: "admin" | "user" | "manager" }) {
    const [user] = await this.db
      .insert(schema.usersTable)
      .values(data)
      .returning({
        id: schema.usersTable.id,
        username: schema.usersTable.username,
        role: schema.usersTable.role,
        createdAt: schema.usersTable.createdAt,
      });
    return user;
  }

  async deleteUser(id: number) {
    await this.db.delete(schema.usersTable).where(eq(schema.usersTable.id, id));
  }

  async updateUser(id: number, data: { passwordHash: string }) {
    await this.db
      .update(schema.usersTable)
      .set(data)
      .where(eq(schema.usersTable.id, id));
  }

  async findByUsername(username: string) {
    const [user] = await this.db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.username, username));
    return user;
  }
}

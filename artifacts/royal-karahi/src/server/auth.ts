import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "admin" | "user" | "manager";
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "user" | "manager";
    isSuperAdmin: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role as "admin" | "user",
        isSuperAdmin: !!token.isSuperAdmin,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const [user] = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            role: usersTable.role,
            isSuperAdmin: usersTable.isSuperAdmin,
            passwordHash: usersTable.passwordHash,
          })
          .from(usersTable)
          .where(eq(usersTable.username, credentials.username as string));

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.username,
          role: user.role as "admin" | "user",
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  pages: {
    signIn: "/login",
  },
});

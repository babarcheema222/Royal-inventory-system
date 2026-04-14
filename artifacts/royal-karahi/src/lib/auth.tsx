import { useSession, signOut } from "next-auth/react";
import { useMemo } from "react";

export interface User {
  id: string;
  username: string;
  role: "admin" | "user" | "manager";
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id || "",
      username: session.user.name || "",
      role: (session.user as any).role || "user",
    } as User;
  }, [session]);

  const role = (session?.user as any)?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin,
    isManager,
    isAnyAdmin: isAdmin || isManager,
    logout: () => signOut({ callbackUrl: "/login" }),
    // Compatibility with old code
    login: () => { console.warn("Login should be handled by NextAuth signIn()") }
  };
}

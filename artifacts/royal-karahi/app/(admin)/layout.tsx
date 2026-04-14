"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-serif text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = session.user.role === "admin";
  const isManager = session.user.role === "manager";
  const isAnyAdmin = isAdmin || isManager;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {isAnyAdmin ? <Sidebar /> : null}
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAnyAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden font-sans">
      {isAnyAdmin ? <Sidebar /> : null}
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto print:overflow-visible transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  );
}


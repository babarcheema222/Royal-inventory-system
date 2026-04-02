import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

export function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {isAdmin ? <Sidebar /> : null}
      <div className="flex flex-col flex-1 min-w-0">
        {!isAdmin ? <TopNav /> : null}
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}

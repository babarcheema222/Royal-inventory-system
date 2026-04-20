"use client";

import { useState } from "react";
import { LogOut, Package, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./Sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export function TopNav() {
  const { user, isAnyAdmin, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-6 no-print flex-shrink-0">
      <div className="flex items-center gap-2">
        {isAnyAdmin && (
          <div className="md:hidden mr-2">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 flex items-center gap-2">
                  <Menu className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-none [&>button]:hidden">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation links for Royal Karahi management system.</SheetDescription>
                </SheetHeader>
                <SidebarContent onClose={() => setIsSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Logo - always show or at least for consistency */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/logo.jpeg"
            alt="Royal Karahi Logo"
            className="h-8 w-8 sm:h-11 sm:w-11 object-contain rounded-sm"
          />
          <h1 className="text-sm sm:text-xl font-black text-primary tracking-tighter leading-none uppercase truncate">
            Royal Karahi
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-right min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-sm font-black text-foreground truncate max-w-[80px] sm:max-w-none">
              {user?.username}
            </span>
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] shadow-inner flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className={cn(
            "text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5",
            user?.role === 'admin' ? 'text-primary' :
              user?.role === 'manager' ? 'text-amber-600' :
                'text-blue-600'
          )}>
            {user?.role === 'user' ? 'Staff' : user?.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isAnyAdmin && (
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { LogOut, Package, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./Sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

export function TopNav() {
  const { user, isAnyAdmin, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 no-print flex-shrink-0">
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
              <SheetContent side="left" className="p-0 w-64 border-none">
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
        <div className="flex items-center gap-2">
          <img 
            src="/logo.jpeg" 
            alt="Royal Karahi Logo" 
            className="h-9 w-9 object-contain"
          />
          <h1 className="text-xl font-bold text-primary tracking-tight">ROYAL KARAHI</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-right mr-2 sm:mr-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
            Logged in as <span className="text-foreground font-black">{user?.username}</span>
          </span>
          <span className={cn(
            "text-xs font-black uppercase tracking-widest mt-0.5",
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

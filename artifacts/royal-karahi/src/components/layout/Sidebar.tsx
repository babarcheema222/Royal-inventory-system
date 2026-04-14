"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, ListTree, FileText, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface SidebarContentProps {
  onClose?: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, isAdmin, isAnyAdmin, logout } = useAuth();

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: ListTree },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    ...(isAdmin ? [{ href: "/admin/users", label: "Users", icon: Users }] : []),
  ];

  if (!isAnyAdmin) return null;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50 gap-3">
        <img 
          src="/logo.jpeg" 
          alt="Royal Karahi Logo" 
          className="h-9 w-9 object-contain"
        />
        <h1 className="text-xl font-bold text-sidebar-primary tracking-widest">ROYAL KARAHI</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={onClose}
              className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                <Icon className="h-5 w-5" />
                {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isAnyAdmin } = useAuth();
  if (!isAnyAdmin) return null;

  return (
    <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border h-full flex-col no-print shadow-xl z-20 flex-shrink-0">
      <SidebarContent />
    </aside>
  );
}

import { LogOut, Package } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const { logout, user, isAdmin } = useAuth();

  if (isAdmin) return null; // Admin uses sidebar instead

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 no-print">
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-primary tracking-tight">ROYAL KARAHI</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium">
          Logged in as {user?.username}
        </span>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

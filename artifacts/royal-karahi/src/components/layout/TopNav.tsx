import { LogOut, Package, Moon, Sun, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Link } from "wouter";

export function TopNav() {
  const { logout, user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

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
        <Link href="/profile">
          <Button variant="ghost" size="icon" title="Profile">
            <UserCircle className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

"use client";

import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  Database,
  History,
  ShieldCheck
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DatabaseManagement() {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const utils = api.useUtils();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [isSuperAdmin, isLoading, router]);

  const clearHistoryMutation = api.inventory.clearHistory.useMutation({
    onSuccess: () => {
      toast.success("Transaction history has been refreshed (soft-deleted).");
      utils.inventory.getTransactions.invalidate();
      utils.inventory.getSummary.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to refresh history: " + err.message);
    }
  });

  if (isLoading || !isSuperAdmin) return null;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight uppercase">Database Management</h1>
        <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Authorized Maintenance Only
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 border-primary/10 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="border-b bg-white/50 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="bg-primary/10 p-3 rounded-2xl w-fit">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">System Refresh</CardTitle>
                <CardDescription className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
                  Maintenance and Cleanup Tools
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-4 md:p-6 rounded-2xl bg-white border-2 border-dashed border-primary/20 shadow-sm transition-all hover:border-primary/40">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Clear Transaction History</h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-md">
                  This action will archive (soft-delete) all current transaction records. 
                  The inventory stock levels will remain unchanged, but the history logs 
                  will be refreshed for a clean start.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  <AlertTriangle className="h-3 w-3" /> Warning: This cannot be undone easily
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" variant="destructive" className="w-full md:w-auto font-black uppercase tracking-widest px-8 shadow-lg shadow-destructive/20 hover:scale-105 transition-transform">
                    <Trash2 className="h-5 w-5 mr-2" /> Refresh History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-2 text-gray-800">
                  <AlertDialogHeader>
                    <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                      <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-black text-center uppercase tracking-tight">Final Confirmation</AlertDialogTitle>
                    <AlertDialogDescription className="text-center font-bold text-muted-foreground pt-2">
                      Are you absolutely certain you want to refresh the database history? 
                      All current logs will be hidden from the dashboard and reports.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
                    <AlertDialogCancel className="font-black uppercase tracking-widest rounded-xl flex-1 h-12">No, Keep History</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-widest rounded-xl flex-1 h-12 shadow-lg shadow-destructive/20"
                      onClick={() => clearHistoryMutation.mutate()}
                      disabled={clearHistoryMutation.isPending}
                    >
                      {clearHistoryMutation.isPending ? "Refreshing..." : "Yes, Refresh Now"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 opacity-60">
              <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/20 flex items-center gap-3">
                <Database className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Database Optimization</span>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/20 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Security Audit Log</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

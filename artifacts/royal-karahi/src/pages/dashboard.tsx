import { useGetInventorySummary, useGetRecentTransactions, useGetLowStockItems } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Layers, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetInventorySummary();
  const { data: recentTransactions, isLoading: loadingTransactions } = useGetRecentTransactions();
  const { data: lowStockItems, isLoading: loadingLowStock } = useGetLowStockItems();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your kitchen stock and activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loadingSummary ? "..." : summary?.totalItems || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-t-4 border-t-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{loadingSummary ? "..." : summary?.lowStockCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loadingSummary ? "..." : summary?.totalCategories || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions Today</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loadingSummary ? "..." : summary?.totalTransactionsToday || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loadingLowStock ? (
              <div className="text-sm text-muted-foreground">Loading alerts...</div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                    </div>
                    <Badge variant="destructive" className="px-3 py-1 font-mono text-sm">
                      {item.currentStock} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center min-h-[200px] text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                No low stock alerts. You're well stocked!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loadingTransactions ? (
              <div className="text-sm text-muted-foreground">Loading transactions...</div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <Badge variant={tx.type === "IN" ? "default" : "secondary"}>
                          {tx.type}
                        </Badge>
                        {tx.subcategoryName}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>by {tx.username}</span>
                        <span>•</span>
                        <span>{format(new Date(tx.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      {tx.notes && <div className="text-sm text-muted-foreground italic">"{tx.notes}"</div>}
                    </div>
                    <div className="font-mono font-medium whitespace-nowrap">
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center min-h-[200px] text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                No recent transactions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

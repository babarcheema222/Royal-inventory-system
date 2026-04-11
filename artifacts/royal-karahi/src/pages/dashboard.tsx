import React, { useMemo } from "react";
import { useGetInventorySummary, useGetRecentTransactions, useGetLowStockItems } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, AlertTriangle, Layers, Activity, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  in: {
    label: "Stock In",
    color: "hsl(var(--primary))",
  },
  out: {
    label: "Stock Out",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetInventorySummary();
  const { data: recentTransactions, isLoading: loadingTransactions } = useGetRecentTransactions();
  const { data: lowStockItems, isLoading: loadingLowStock } = useGetLowStockItems();

  const chartData = useMemo(() => {
    if (!recentTransactions) return [];

    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();

    return days.map(day => {
      const dayTxs = recentTransactions.filter(tx => isSameDay(new Date(tx.createdAt), day));
      return {
        date: format(day, "MMM d"),
        in: dayTxs.filter(tx => tx.type === "IN").reduce((acc, tx) => acc + tx.quantity, 0),
        out: dayTxs.filter(tx => tx.type === "OUT").reduce((acc, tx) => acc + tx.quantity, 0),
      };
    });
  }, [recentTransactions]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg italic">Royal Karahi Inventory System</p>
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/10 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Live Updates Active</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-none bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Assets</CardTitle>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Package className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{loadingSummary ? "..." : summary?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique stock units trackable</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-card to-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Critical Stock</CardTitle>
            <div className="bg-destructive/10 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive font-serif">{loadingSummary ? "..." : summary?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Items requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-card to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Departments</CardTitle>
            <div className="bg-secondary/10 p-2 rounded-lg">
              <Layers className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{loadingSummary ? "..." : summary?.totalCategories || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Master categories active</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-card to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily Velocity</CardTitle>
            <div className="bg-accent/10 p-2 rounded-lg">
              <Activity className="w-4 h-4 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{loadingSummary ? "..." : summary?.totalTransactionsToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions recorded today</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-none overflow-hidden">
        <CardHeader className="bg-muted/30 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif">Inventory Activity</CardTitle>
              <CardDescription>Visualizing stock inflow vs kitchen usage over the last 7 days.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="out"
                type="natural"
                fill="var(--color-out)"
                fillOpacity={0.4}
                stroke="var(--color-out)"
                stackId="a"
              />
              <Area
                dataKey="in"
                type="natural"
                fill="var(--color-in)"
                fillOpacity={0.4}
                stroke="var(--color-in)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingLowStock ? (
              <div className="text-sm text-muted-foreground animate-pulse">Scanning inventory...</div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 group">
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{item.categoryName}</div>
                    </div>
                    <Badge variant="destructive" className="px-4 py-1.5 font-mono text-sm shadow-sm">
                      {item.currentStock} {item.unit} REMAINING
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center min-h-[250px] text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 p-8 text-center">
                <Package className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-lg">Supply Chain Optimal</p>
                <p className="text-sm">All items are currently above threshold levels.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg font-bold uppercase tracking-wide">Recent Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingTransactions ? (
              <div className="text-sm text-muted-foreground animate-pulse">Retrieving audit log...</div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 hover:bg-muted/5 transition-colors p-2 rounded-lg -m-2">
                    <div className="space-y-1">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <Badge variant={tx.type === "IN" ? "default" : "secondary"} className={tx.type === "IN" ? "bg-primary" : "bg-secondary text-secondary-foreground"}>
                          {tx.type}
                        </Badge>
                        {tx.subcategoryName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">@{tx.username}</span>
                        <span>•</span>
                        <span>{format(new Date(tx.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      {tx.notes && <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded border italic mt-2">"{tx.notes}"</div>}
                    </div>
                    <div className={`font-mono font-bold text-lg whitespace-nowrap ${tx.type === "IN" ? "text-primary" : "text-secondary font-bold"}`}>
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity} {tx.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center min-h-[250px] text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 p-8 text-center">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-lg">No Recent Activity</p>
                <p className="text-sm">Start recording transactions to see them here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

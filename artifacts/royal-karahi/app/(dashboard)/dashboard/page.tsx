"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Layers, Activity, TrendingUp, ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format, subDays, isSameDay } from "date-fns";
import { generatePDF } from "@/utils/pdf-generator";
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

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-muted rounded-md", className)} />
);

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = api.inventory.getSummary.useQuery(undefined, {
    staleTime: 60000 // Cache summary for 1 min (server-side also has 60s cache)
  });
  
  // Phase 2: Heavier data loaded lazily/non-blocking
  const { data: transactions, isLoading: loadingTransactions } = api.inventory.getRecentTransactions.useQuery(undefined, {
    staleTime: 15000 
  });
  
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const { data: lowStockItems, isLoading: loadingLowStock } = api.inventory.getLowStock.useQuery(undefined, {
    enabled: isLowStockModalOpen,
    staleTime: 10000
  });

  const { refetch: fetchAllStock } = api.inventory.list.useQuery({}, { enabled: false });

  const downloadRemainingStockPDF = async () => {
    const { data: stockItems } = await fetchAllStock();
    if (!stockItems) return;

    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    const head = [["Item Name", "Category", "Current Stock (Remaining)"]];
    const body = stockItems
      .sort((a, b) => (a.categoryName || "").localeCompare(b.categoryName || ""))
      .map(item => [
        item.name,
        item.categoryName,
        `${Number(item.currentStock).toFixed(2)} ${item.unit}`
      ]);

    generatePDF({
      title: "Current Stock Inventory Report",
      subtitle: "Comprehensive list of all inventory items and quantities.",
      fileName: `royal-karahi-remaining-stock-${dateFormatted}.pdf`,
      head,
      body,
      showSignature: true
    });
  };

  const chartData = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    const days = Array.from({ length: 7 }, (_, i) =>
      subDays(new Date(), i)
    ).reverse();

    return days.map(day => {
      const dayTxs = transactions.filter(tx =>
        isSameDay(new Date(tx.createdAt), day)
      );

      return {
        date: format(day, "MMM d"),
        in: dayTxs
          .filter(tx => tx.type === "IN")
          .reduce((acc, tx) => acc + tx.quantity, 0),
        out: dayTxs
          .filter(tx => tx.type === "OUT")
          .reduce((acc, tx) => acc + tx.quantity, 0),
      };
    });
  }, [transactions]);

  const downloadLowStockPDF = () => {
    if (!lowStockItems) return;

    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    const head = [["Item Name", "Category", "Current Stock"]];
    const body = lowStockItems.map(item => [
      item.name,
      item.categoryName,
      `${Number(item.currentStock).toFixed(2)} ${item.unit}`
    ]);

    generatePDF({
      title: "Critical Stock Inventory Report",
      subtitle: "Items currently below the safety threshold (10 units).",
      fileName: `royal-karahi-critical-stock-${dateFormatted}.pdf`,
      head,
      body,
      showSignature: true
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg font-bold">Royal Karahi Inventory System</p>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg border-none bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-gray-800">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Assets</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Package className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalItems || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Unique stock units trackable</p>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg border-none bg-gradient-to-br from-card to-destructive/5 text-gray-800 cursor-pointer hover:scale-[1.02] transition-transform group"
            onClick={() => setIsLowStockModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-destructive transition-colors">Critical Stock</CardTitle>
              <div className="bg-destructive/10 p-2 rounded-lg group-hover:bg-destructive/20 transition-colors">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-destructive font-bold">{summary?.lowStockCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Items requiring attention <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-card to-secondary/5 text-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Remaining Stock
            </CardTitle>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
              onClick={downloadRemainingStockPDF}
              title="Download Remaining Stock PDF"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
            </Button>
          </CardHeader>

          <CardContent>
            <div className="text-xl font-bold">All Stock</div>
            <p className="text-xs text-muted-foreground mt-1">
              Export full inventory list
            </p>
          </CardContent>
        </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-card to-accent/5 text-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily History</CardTitle>
              <div className="bg-accent/10 p-2 rounded-lg">
                <Activity className="w-4 h-4 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalTransactionsToday || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Transactions in last 24 hours</p>
            </CardContent>
          </Card>
      </div>

      {/* CHART */}
      <Card className="shadow-xl border-none overflow-hidden text-gray-800">
        <CardHeader className="bg-muted/30 pb-8">
          <CardTitle className="text-xl font-bold">Inventory Activity</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="px-2 md:px-6 pb-6 min-h-[300px] flex items-center justify-center">
          {loadingTransactions ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Skeleton className="h-[250px] w-full" />
              <p className="text-sm animate-pulse">Calculating trends...</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area type="monotone" dataKey="out" stroke={chartConfig.out.color} fill={chartConfig.out.color} fillOpacity={0.1} />
                <Area type="monotone" dataKey="in" stroke={chartConfig.in.color} fill={chartConfig.in.color} fillOpacity={0.1} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* RECENT ACTIVITY */}
      <Card className="shadow-lg border-none text-gray-800">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg font-bold uppercase tracking-wide">Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingTransactions ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">{tx.subcategoryName}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, h:mm a")} by {tx.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type}
                    </span>
                    <span className="font-mono font-bold">{tx.quantity} {tx.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No Recent Activity</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isLowStockModalOpen} onOpenChange={setIsLowStockModalOpen}>
        <DialogContent className="max-w-2xl text-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Stock Items
            </DialogTitle>
            <DialogDescription>
              The following items are below the safety threshold (10 units).
            </DialogDescription>
            {lowStockItems && lowStockItems.length > 0 && (
              <div className="absolute right-12 top-6">
                <Button
                  onClick={downloadLowStockPDF}
                  className="bg-primary hover:bg-primary/90 text-white font-bold h-9 w-9 p-0 flex items-center justify-center rounded-lg shadow-sm"
                  size="sm"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            )}
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {loadingLowStock ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">Loading critical items...</div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.categoryName}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="font-mono">
                          {Number(item.currentStock).toFixed(2)} {item.unit}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No critical stock items found.</p>
                <p className="text-sm">All inventory levels are currently healthy.</p>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}

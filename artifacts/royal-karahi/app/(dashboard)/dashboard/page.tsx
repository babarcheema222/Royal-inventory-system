"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, AlertCircle, Layers, Activity, TrendingUp, ArrowRight, Download } from "lucide-react";
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
    color: "#10b981", // Emerald Green
  },
  out: {
    label: "Stock Out",
    color: "#991b1b", // Deep Red (Royal Karahi Brand)
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

  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  const [isRemainingStockModalOpen, setIsRemainingStockModalOpen] = useState(false);
  const { data: stockItems, isLoading: loadingStock } = api.inventory.list.useQuery({}, { 
    enabled: isRemainingStockModalOpen || isAssetsModalOpen,
    staleTime: 30000
  });

  const groupedStock = useMemo(() => {
    if (!stockItems) return {};
    return stockItems.reduce((acc, item) => {
      const cat = item.categoryName || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof stockItems>);
  }, [stockItems]);

  const downloadRemainingStockPDF = async () => {
    if (!stockItems) return;

    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    const head = [["Item Name", "Current Stock (Remaining)"]];
    
    // Build grouped body with category headers
    const body: any[] = [];
    const sortedCategories = Object.keys(groupedStock).sort();
    
    sortedCategories.forEach(cat => {
      // Add category header row
      const headerRow = [cat.toUpperCase(), ""];
      (headerRow as any)._isHighlighted = true;
      body.push(headerRow);
      
      // Add items for this category
      const items = groupedStock[cat]!.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach(item => {
        body.push([
          item.name,
          `${Number(item.currentStock).toFixed(2)} ${item.unit}`
        ]);
      });
    });

    generatePDF({
      title: "Current Stock Inventory Report",
      subtitle: "Grouped by category with highlighted section headers.",
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
          <Card 
            className="shadow-lg border-none bg-gradient-to-br from-card to-muted/30 cursor-pointer hover:scale-[1.02] transition-transform group"
            onClick={() => setIsAssetsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-gray-800">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Total Assets</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Package className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalItems || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Unique items tracked <ArrowRight className="w-3 h-3" />
              </p>
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

          <Card 
            className="shadow-lg border-none bg-gradient-to-br from-card to-secondary/5 text-gray-800 cursor-pointer hover:scale-[1.02] transition-transform group"
            onClick={() => setIsRemainingStockModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                Remaining Stock
              </CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Layers className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-xl font-bold">Current Inventory</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                View all items by category <ArrowRight className="w-3 h-3" />
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
                <Area 
                  type="monotone" 
                  dataKey="out" 
                  stroke={chartConfig.out.color} 
                  fill={chartConfig.out.color} 
                  fillOpacity={0.1} 
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="in" 
                  stroke={chartConfig.in.color} 
                  fill={chartConfig.in.color} 
                  fillOpacity={0.1} 
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
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
      <Dialog open={isRemainingStockModalOpen} onOpenChange={setIsRemainingStockModalOpen}>
        <DialogContent className="max-w-3xl text-gray-800">
          <DialogHeader>
            <div className="flex justify-between items-start pr-8">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Current Stock Inventory
                </DialogTitle>
                <DialogDescription>
                  Complete list of all items currently in stock, grouped by category.
                </DialogDescription>
              </div>
              {stockItems && stockItems.length > 0 && (
                <Button
                  onClick={downloadRemainingStockPDF}
                  className="bg-primary hover:bg-primary/90 text-white font-bold h-9 w-9 p-0 flex items-center justify-center rounded-lg shadow-sm shrink-0"
                  size="sm"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto">
            {loadingStock ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                Loading inventory...
              </div>
            ) : stockItems && stockItems.length > 0 ? (
              <div className="space-y-6">
                {Object.keys(groupedStock).sort().map(category => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-primary tracking-widest bg-primary/5 px-3 py-2 rounded-lg border-l-4 border-primary">
                      {category}
                    </h3>
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-bold py-2">Item Name</TableHead>
                          <TableHead className="text-right font-bold py-2">Current Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedStock[category]!.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/5">
                            <TableCell className="font-semibold py-2">{item.name}</TableCell>
                            <TableCell className="text-right py-2">
                              <Badge variant={Number(item.currentStock) <= 10 ? "destructive" : "outline"} className="font-mono">
                                {Number(item.currentStock).toFixed(2)} {item.unit}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No stock items found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAssetsModalOpen} onOpenChange={setIsAssetsModalOpen}>
        <DialogContent className="max-w-2xl text-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <Package className="w-5 h-5" />
              Asset Inventory Hierarchy
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of all categories and sub-categories managed in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {loadingStock ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                Loading assets...
              </div>
            ) : stockItems && stockItems.length > 0 ? (
              <div className="space-y-4">
                {Object.keys(groupedStock).sort().map(category => (
                  <div key={category} className="border rounded-xl overflow-hidden bg-muted/10">
                    <div className="bg-muted px-4 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                        {category}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {groupedStock[category]?.length} Items
                      </Badge>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupedStock[category]!.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-primary/5 shadow-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                          <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                          {item.isLowStock && (
                            <div className="ml-auto">
                              <AlertCircle className="h-3 w-3 text-destructive animate-pulse" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No assets found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

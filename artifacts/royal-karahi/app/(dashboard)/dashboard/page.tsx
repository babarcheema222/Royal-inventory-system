"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Layers, Activity, TrendingUp, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { format, subDays, isSameDay } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const { data: summary, isLoading: loadingSummary } = api.inventory.getSummary.useQuery();
  const { data: transactions, isLoading: loadingTransactions } = api.inventory.getRecentTransactions.useQuery();
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const { data: lowStockItems, isLoading: loadingLowStock } = api.inventory.getLowStock.useQuery(undefined, {
    enabled: isLowStockModalOpen
  });

  const { refetch: fetchAllStock } = api.inventory.list.useQuery({}, { enabled: false });

  const downloadRemainingStockPDF = async () => {
    const { data: stockItems } = await fetchAllStock();
    if (!stockItems) return;

    // Group by Category
    const grouped = stockItems.reduce((acc, item) => {
      const cat = item.categoryName || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof stockItems>);

    const doc = new jsPDF();
    const dateStr = format(new Date(), "PPP p");

    // Header logic
    doc.setFontSize(22);
    doc.setTextColor(153, 27, 27); // Burgundy
    doc.text("ROYAL KARAHI", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Current Stock Inventory Report", 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${dateStr}`, 14, 38);

    let currentY = 50;

    // Categories Loop
    Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, items]) => {
        // Page break check
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Highlighted Category Header
        doc.setFillColor(153, 27, 27); // Burgundy
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(category.toUpperCase(), 18, currentY + 6);

        currentY += 8;

        const tableData = items
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .map(item => [
            item.name,
            `${Number(item.currentStock).toFixed(2)} ${item.unit}`
          ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Item Name", "Current Stock (Remaining)"]],
          body: tableData,
          headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [252, 252, 252] },
          styles: { fontSize: 10, cellPadding: 3 },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => {
             // currentY is updated by finalY below
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      });

    // Footer - Only on the last page
    const lastPage = (doc as any).internal.getNumberOfPages();
    doc.setPage(lastPage);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    const centerX = doc.internal.pageSize.width / 2;
    const bottomY = doc.internal.pageSize.height - 10;

    const text1 = "(Designed and Manged by ";
    const text2 = "BABAR CHEEMA";
    const text3 = " )";

    const width1 = doc.getTextWidth(text1);
    const width2 = doc.getTextWidth(text2);
    const width3 = doc.getTextWidth(text3);
    const totalWidth = width1 + width2 + width3;

    let currentX = centerX - (totalWidth / 2);

    doc.setTextColor(120, 120, 120);
    doc.text(text1, currentX, bottomY);
    currentX += width1;

    doc.setTextColor(0, 0, 0); // Bold Black
    doc.text(text2, currentX, bottomY);
    currentX += width2;

    doc.setTextColor(120, 120, 120);
    doc.text(text3, currentX, bottomY);

    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    doc.save(`royal-karahi-remaining-stock-${dateFormatted}.pdf`);
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

    const doc = new jsPDF();
    const dateStr = format(new Date(), "PPP p");

    // Header
    doc.setFontSize(22);
    doc.setTextColor(153, 27, 27); // Burgundy
    doc.text("ROYAL KARAHI", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Critical Stock Inventory Report", 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${dateStr}`, 14, 38);

    // Table
    const tableData = lowStockItems.map(item => [
      item.name,
      item.categoryName,
      `${Number(item.currentStock).toFixed(2)} ${item.unit}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Item Name", "Category", "Current Stock"]],
      body: tableData,
      headStyles: { fillColor: [153, 27, 27], fontStyle: 'bold' }, // Burgundy
      alternateRowStyles: { fillColor: [249, 249, 249] },
      margin: { top: 45 },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Footer - Only on the last page
    const lastPage = (doc as any).internal.getNumberOfPages();
    doc.setPage(lastPage);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    const centerX = doc.internal.pageSize.width / 2;
    const bottomY = doc.internal.pageSize.height - 10;

    const text1 = "(Designed and Manged by ";
    const text2 = "BABAR CHEEMA";
    const text3 = " )";

    const width1 = doc.getTextWidth(text1);
    const width2 = doc.getTextWidth(text2);
    const width3 = doc.getTextWidth(text3);
    const totalWidth = width1 + width2 + width3;

    let currentX = centerX - (totalWidth / 2);

    doc.setTextColor(120, 120, 120);
    doc.text(text1, currentX, bottomY);
    currentX += width1;

    doc.setTextColor(0, 0, 0); // Bold Black
    doc.text(text2, currentX, bottomY);
    currentX += width2;

    doc.setTextColor(120, 120, 120);
    doc.text(text3, currentX, bottomY);

    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    doc.save(`royal-karahi-critical-stock-${dateFormatted}.pdf`);
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
            <div className="text-3xl font-bold">{loadingSummary ? "..." : summary?.totalItems || 0}</div>
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
            <div className="text-3xl font-bold text-destructive font-bold">{loadingSummary ? "..." : summary?.lowStockCount || 0}</div>
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
            <div className="text-3xl font-bold">{loadingSummary ? "..." : summary?.totalTransactionsToday || 0}</div>
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
        <CardContent className="px-2 md:px-6 pb-6">
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
        </CardContent>
      </Card>

      {/* RECENT ACTIVITY */}
      <Card className="shadow-lg border-none text-gray-800">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg font-bold uppercase tracking-wide">Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingTransactions ? (
            <div className="text-sm text-muted-foreground animate-pulse">Retrieving audit log...</div>
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

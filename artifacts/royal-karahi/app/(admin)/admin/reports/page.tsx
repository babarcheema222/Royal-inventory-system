"use client";

import { useState, useMemo } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, BarChart3, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [dateRange, setDateRange] = useState({
    from: todayStr,
    to: todayStr,
  });

  const { data: transactions, isLoading } = api.inventory.getTransactions.useQuery({
    from: parseISO(dateRange.from + "T00:00:00"),
    to: parseISO(dateRange.to + "T23:59:59")
  });

  const summary = transactions ? {
    totalIn: transactions.filter(t => t.type === 'IN').length,
    totalOut: transactions.filter(t => t.type === 'OUT').length,
    totalTransactions: transactions.length
  } : null;

  const groupedTransactions = useMemo(() => {
    if (!transactions) return null;
    return transactions.reduce((acc, tx) => {
      const cat = tx.categoryName || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tx);
      return acc;
    }, {} as Record<string, typeof transactions>);
  }, [transactions]);

  const handleDownloadPDF = () => {
    if (!transactions || !groupedTransactions) return;

    const doc = new jsPDF();
    const dateStr = format(new Date(), "PPP p");
    const reportDateRange = `${format(parseISO(dateRange.from), "PPP")} — ${format(parseISO(dateRange.to), "PPP")}`;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(153, 27, 27); // Burgundy
    doc.text("ROYAL KARAHI", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Inventory Log Report", 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Filtered: ${reportDateRange}`, 14, 38);
    doc.text(`Generated on: ${dateStr}`, 14, 44);

    // Summary Stats
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 50, 182, 20, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 18, 56);
    doc.setFont("helvetica", "normal");
    doc.text(`Total In: ${summary?.totalIn || 0}`, 18, 64);
    doc.text(`Total Out: ${summary?.totalOut || 0}`, 70, 64);
    doc.text(`Total Transactions: ${summary?.totalTransactions || 0}`, 130, 64);

    let currentY = 75;

    // Categories
    Object.entries(groupedTransactions)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, items]) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(153, 27, 27);
        doc.text(category.toUpperCase(), 14, currentY);
        currentY += 5;

        const tableData = items.map(tx => [
          format(new Date(tx.createdAt), "MM/dd HH:mm"),
          tx.subcategoryName,
          tx.type,
          `${tx.type === "IN" ? "+" : "-"}${tx.quantity} ${tx.unit}`,
          tx.username,
          tx.notes || "-"
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Time", "Item Name", "Type", "Quantity", "User", "Notes"]],
          body: tableData,
          headStyles: { fillColor: [153, 27, 27], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [249, 249, 249] },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => {
            currentY = data.cursor ? data.cursor.y + 15 : currentY + 20;
          }
        });
        
        // Ensure currentY is updated for next category
        currentY = (doc as any).lastAutoTable.finalY + 15;
      });

    // Branding Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
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
      
      let startX = centerX - (totalWidth / 2);
      doc.setTextColor(120, 120, 120);
      doc.text(text1, startX, bottomY);
      startX += width1;
      doc.setTextColor(37, 99, 235);
      doc.text(text2, startX, bottomY);
      startX += width2;
      doc.setTextColor(120, 120, 120);
      doc.text(text3, startX, bottomY);
    }

    doc.save(`inventory-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const setToday = () => {
    setDateRange({
      from: todayStr,
      to: todayStr,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto print:p-0 print-area relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">System Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase">Audit stock movements and inventory history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadPDF} className="font-bold border-2">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none shadow-md text-gray-800 border-2 overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
                <FileText className="h-6 w-6 text-primary" />
                ROYAL  KARAHI  Inventory  Log
              </CardTitle>
              <CardDescription className="font-black text-foreground text-lg">
                Filtered: {format(parseISO(dateRange.from), "PPP")} — {format(parseISO(dateRange.to), "PPP")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 print:hidden bg-background p-2 rounded-lg border shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs mr-2 font-bold px-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={setToday}
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Today
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="grid gap-1">
                <Label htmlFor="from" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">From</Label>
                <Input
                  id="from"
                  type="date"
                  className="h-9 border-none focus-visible:ring-0 font-bold"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div className="h-8 w-px bg-border mx-2" />
              <div className="grid gap-1">
                <Label htmlFor="to" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">To</Label>
                <Input
                  id="to"
                  type="date"
                  className="h-9 border-none focus-visible:ring-0 font-bold"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* HORIZONTAL STATS - Forced side-by-side even in print */}
        <div className="grid grid-cols-3 divide-x border-b bg-white print:grid-cols-3">
          <div className="p-6 space-y-1 text-center sm:text-left">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Total In (Count)</p>
            <p className="text-4xl font-black text-primary print:text-black">
              {summary?.totalIn || 0}
            </p>
          </div>
          <div className="p-6 space-y-1 text-center sm:text-left border-x">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Total Out (Count)</p>
            <p className="text-4xl font-black text-secondary print:text-black">
              {summary?.totalOut || 0}
            </p>
          </div>
          <div className="p-6 space-y-1 text-center sm:text-left">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Total Txns</p>
            <p className="text-4xl font-black text-foreground print:text-black">
              {isLoading ? "..." : summary?.totalTransactions || 0}
            </p>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
              Compiling report data...
            </div>
          ) : groupedTransactions && Object.keys(groupedTransactions).length > 0 ? (
            <div className="divide-y-4 divide-muted">
              {Object.entries(groupedTransactions).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
                <div key={category} className="space-y-4 pt-8 pb-12 first:pt-4">
                  <div className="px-6">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tighter border-l-4 border-primary pl-4 bg-primary/5 py-2">
                      {category}
                    </h3>
                  </div>
                  <div className="px-4 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30 print:bg-transparent text-gray-800">
                        <TableRow className="border-b-2">
                          <TableHead className="font-bold w-[15%]">Time</TableHead>
                          <TableHead className="font-bold w-[25%]">Item Name</TableHead>
                          <TableHead className="font-bold w-[10%]">Type</TableHead>
                          <TableHead className="text-right font-bold w-[15%]">Quantity</TableHead>
                          <TableHead className="font-bold w-[15%]">User</TableHead>
                          <TableHead className="font-bold w-[20%]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((tx) => (
                          <TableRow key={tx.id} className="print:border-black/10 border-b hover:bg-muted/5 transition-colors">
                            <TableCell className="whitespace-nowrap font-bold text-[11px] uppercase tracking-tighter">
                              {format(new Date(tx.createdAt), "MM/dd HH:mm")}
                            </TableCell>
                            <TableCell className="font-black text-primary uppercase tracking-tight">
                              {tx.subcategoryName}
                            </TableCell>
                            <TableCell>
                              <span className={`font-black text-[10px] px-2 py-0.5 rounded-sm border ${tx.type === 'IN' ? 'bg-primary/10 border-primary/20 text-primary print:text-black' : 'bg-secondary/10 border-secondary/20 text-secondary print:text-black'}`}>
                                {tx.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-black text-sm">
                              <span className={tx.type === "IN" ? "text-primary" : "text-secondary"}>
                                {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                              </span>
                              <span className="text-[10px] ml-1 text-muted-foreground uppercase">{tx.unit}</span>
                            </TableCell>
                            <TableCell className="text-xs font-black uppercase tracking-tighter text-muted-foreground">{tx.username}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground print:text-black/70 font-bold leading-tight">
                              {tx.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-6 opacity-10" />
                <p className="font-black text-xl text-foreground uppercase tracking-widest">No Data Recorded</p>
                <p className="text-sm font-bold opacity-60">Any movements after 12:00 AM local time will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-100 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
        (Designed and Manged by <span className="text-blue-600">BABAR CHEEMA</span> )
      </div>
    </div>
  );
}

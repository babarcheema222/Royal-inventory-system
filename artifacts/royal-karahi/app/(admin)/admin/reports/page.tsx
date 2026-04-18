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
import { jsPDF } from "jspdf";
import { generatePDF } from "@/utils/pdf-generator";

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
    if (!transactions) return;

    const reportDateRange = `${format(parseISO(dateRange.from), "PPP")} — ${format(parseISO(dateRange.to), "PPP")}`;
    const isTodayReport = dateRange.from === todayStr && dateRange.to === todayStr;
    const fileName = isTodayReport 
      ? `ROYAL-STOCK-REPORT-TODAY-${format(new Date(), "yyyy-MM-dd")}.pdf`
      : `Report-from-${dateRange.from}-to-${dateRange.to}.pdf`;

    const head = [["Time", "Item Name", "Type", "Quantity", "User", "Notes"]];
    
    // Group transactions by date for the PDF
    const groupedByDate: Record<string, typeof transactions> = {};
    transactions.forEach(tx => {
      const dateKey = format(new Date(tx.createdAt), "PPPP"); // Thursday, April 16th, 2026
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(tx);
    });

    const body: any[] = [];
    // Sort dates by descending order (newest dates first)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      new Date(groupedByDate[b]![0]!.createdAt).getTime() - new Date(groupedByDate[a]![0]!.createdAt).getTime()
    );

    sortedDates.forEach(date => {
      // Add highlighted Date Header
      const headerRow = [date.toUpperCase(), "", "", "", "", ""];
      (headerRow as any)._isHighlighted = true;
      body.push(headerRow);

      // Add individual transactions for this date
      groupedByDate[date]!.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).forEach(tx => {
        body.push([
          format(new Date(tx.createdAt), "HH:mm"),
          tx.subcategoryName,
          tx.type,
          `${tx.type === "IN" ? "+" : "-"}${tx.quantity} ${tx.unit}`,
          tx.username,
          tx.notes || "-"
        ]);
      });
    });

    generatePDF({
      title: "Inventory Log Report",
      subtitle: `Filtered: ${reportDateRange}`,
      fileName,
      head,
      body,
      showSignature: true
    });
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
          <Button variant="outline" onClick={handleDownloadPDF} className="font-bold border-2" aria-label="Download PDF Stock Report" title="Download PDF Stock Report">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none shadow-xl text-gray-800 border-0 md:border-2 overflow-hidden rounded-2xl md:rounded-xl">
        <CardHeader className="border-b bg-gradient-to-br from-muted/50 to-background pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">
                  Royal Karahi<br className="md:hidden" /> <span className="text-primary/60">Inventory Log</span>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <CardDescription className="font-extrabold text-muted-foreground text-[10px] md:text-xs uppercase tracking-[0.2em]">
                  Filtered: {format(parseISO(dateRange.from), "MMM d")} — {format(parseISO(dateRange.to), "MMM d")}
                </CardDescription>
              </div>
            </div>

            <div className="w-full md:w-auto">
              {/* Filter Section - Stacked Today at top, From/To row below */}
              <div className="bg-background/80 backdrop-blur-sm p-4 md:p-3 rounded-2xl border shadow-sm space-y-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-11 md:h-9 text-xs font-black bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-all w-full md:w-auto shadow-sm"
                  onClick={setToday}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Today Only
                </Button>
                
                <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:items-center md:gap-4 w-full">
                  <div className="grid gap-1">
                    <Label htmlFor="report-from" className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">From</Label>
                    <Input
                      id="report-from"
                      name="reportFrom"
                      type="date"
                      className="h-10 md:h-9 bg-muted/20 border-0 focus-visible:ring-1 font-bold text-xs rounded-xl px-2"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="report-to" className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">To</Label>
                    <Input
                      id="report-to"
                      name="reportTo"
                      type="date"
                      className="h-10 md:h-9 bg-muted/20 border-0 focus-visible:ring-1 font-bold text-xs rounded-xl px-2"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* STATS OVERVIEW - Horizontal on all screens */}
        <div className="grid grid-cols-3 divide-x border-b bg-white/50 backdrop-blur-xs">
          <div className="p-4 md:p-10 space-y-1 text-center transition-colors hover:bg-emerald-50/50">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Total<br className="md:hidden" /> In</p>
            <p className="text-3xl md:text-5xl font-black text-emerald-600 drop-shadow-sm">
              {summary?.totalIn || 0}
            </p>
          </div>
          <div className="p-4 md:p-10 space-y-1 text-center transition-colors hover:bg-red-50/50">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Total<br className="md:hidden" /> Out</p>
            <p className="text-3xl md:text-5xl font-black text-red-600 drop-shadow-sm">
              {summary?.totalOut || 0}
            </p>
          </div>
          <div className="p-4 md:p-10 space-y-1 text-center transition-colors hover:bg-muted/[0.1]">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Total<br className="md:hidden" /> Txns</p>
            <p className="text-3xl md:text-5xl font-black text-foreground drop-shadow-sm">
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
                              <span className={`font-black text-[10px] px-2 py-0.5 rounded-sm border ${tx.type === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {tx.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-black text-sm">
                              <span className={tx.type === "IN" ? "text-emerald-600" : "text-red-600"}>
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

      <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-100 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
        (Designed and Managed by{" "}
        <a 
          href="https://babarcheema-portfolio.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline"
        >
          BABAR CHEEMA
        </a>{" "}
        )
      </div>
    </div>
  );
}

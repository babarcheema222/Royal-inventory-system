"use client";

import { useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Printer, BarChart3, CalendarDays } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, parseISO } from "date-fns";

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

  const handlePrint = () => {
    window.print();
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
          <p className="text-muted-foreground mt-1">Audit stock movements and inventory history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint} className="font-bold">
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none shadow-md text-gray-800">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Inventory Audit Log
              </CardTitle>
              <CardDescription className="font-bold text-foreground">
                Filtered from {format(parseISO(dateRange.from), "PPP")} to {format(parseISO(dateRange.to), "PPP")}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Total In (Count)</p>
            <p className="text-3xl font-black text-primary print:text-black">
              {summary?.totalIn || 0}
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Total Out (Count)</p>
            <p className="text-3xl font-black text-secondary print:text-black">
              {summary?.totalOut || 0}
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Total Transactions</p>
            <p className="text-3xl font-black text-foreground print:text-black">
              {isLoading ? "..." : summary?.totalTransactions || 0}
            </p>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 print:bg-transparent text-gray-800">
              <TableRow className="print:border-black/20">
                <TableHead className="font-bold">Time</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Item</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="text-right font-bold">Quantity</TableHead>
                <TableHead className="font-bold">User</TableHead>
                <TableHead className="w-[30%] font-bold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground animate-pulse">Loading report data...</TableCell>
                </TableRow>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="print:border-black/10">
                    <TableCell className="whitespace-nowrap font-medium text-xs">{format(new Date(tx.createdAt), "MM/dd HH:mm")}</TableCell>
                    <TableCell className="text-xs uppercase font-bold text-muted-foreground">{tx.categoryName}</TableCell>
                    <TableCell className="font-bold text-primary">{tx.subcategoryName}</TableCell>
                    <TableCell>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-full ${tx.type === 'IN' ? 'bg-primary/10 text-primary print:text-black' : 'bg-secondary/10 text-secondary print:text-black'}`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-sm">
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity} {tx.unit}
                    </TableCell>
                    <TableCell className="text-xs font-bold">{tx.username}</TableCell>
                    <TableCell className="text-xs text-muted-foreground print:text-black/70 font-medium">
                      {tx.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold text-foreground">No transactions found for today.</p>
                      <p className="text-sm font-medium">Any movements after 12:00 AM local time will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Print Footer */}
      <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-100 italic text-muted-foreground text-sm font-medium">
        (Designed and Manged by BABAR CHEEMA )
      </div>
    </div>
  );
}

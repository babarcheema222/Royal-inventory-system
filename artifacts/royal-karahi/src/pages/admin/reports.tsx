import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listInventory, getRangeReport, getDailyReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Download, FileText, Printer, BarChart3 } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: format(startOfDay(new Date()), "yyyy-MM-dd"),
    to: format(endOfDay(new Date()), "yyyy-MM-dd"),
  });

  const { data: activeReport, isLoading } = useQuery({
    queryKey: ["report", dateRange],
    queryFn: () => getRangeReport({ from: dateRange.from, to: dateRange.to }),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto print:p-0 print-area relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">System Reports</h1>
          <p className="text-muted-foreground mt-1">Audit stock movements and inventory history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Inventory Audit Log
              </CardTitle>
              <CardDescription>
                Filtered from {format(new Date(dateRange.from), "PPP")} to {format(new Date(dateRange.to), "PPP")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 print:hidden bg-background p-2 rounded-lg border shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs mr-2 font-semibold"
                onClick={() => setDateRange({
                  from: format(startOfDay(new Date()), "yyyy-MM-dd"),
                  to: format(endOfDay(new Date()), "yyyy-MM-dd"),
                })}
              >
                Today
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="grid gap-1">
                <Label htmlFor="from" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">From</Label>
                <Input 
                  id="from" 
                  type="date" 
                  className="h-9 border-none focus-visible:ring-0"
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
                  className="h-9 border-none focus-visible:ring-0"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground">Total In (Count)</p>
            <p className="text-2xl font-bold text-primary print:text-black">
              {activeReport?.summary?.totalIn || 0}
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground">Total Out (Count)</p>
            <p className="text-2xl font-bold text-secondary print:text-black">
              {activeReport?.summary?.totalOut || 0}
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground print:text-black">
              {isLoading ? "..." : activeReport?.summary?.totalTransactions || 0}
            </p>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 print:bg-transparent">
              <TableRow className="print:border-black/20">
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-[30%]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading report data...</TableCell>
                </TableRow>
              ) : activeReport?.transactions && activeReport.transactions.length > 0 ? (
                activeReport.transactions.map((tx) => (
                  <TableRow key={tx.id} className="print:border-black/10">
                    <TableCell className="whitespace-nowrap">{format(new Date(tx.createdAt), "MM/dd HH:mm")}</TableCell>
                    <TableCell>{tx.categoryName}</TableCell>
                    <TableCell className="font-medium">{tx.subcategoryName}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${tx.type === 'IN' ? 'text-primary print:text-black' : 'text-secondary print:text-black'}`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity} {tx.unit}
                    </TableCell>
                    <TableCell>{tx.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground print:text-black/70">
                      {tx.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium">No transactions found for this period.</p>
                      <p className="text-sm">Try adjusting your date filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

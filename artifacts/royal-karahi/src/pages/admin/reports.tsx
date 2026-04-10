import { useState } from "react";
import { useGetDailyReport, useGetRangeReport, getGetDailyReportQueryKey, getGetRangeReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [reportType, setReportType] = useState<"daily" | "range">("daily");
  const [dailyDate, setDailyDate] = useState(today);
  const [rangeFrom, setRangeFrom] = useState(today);
  const [rangeTo, setRangeTo] = useState(today);

  const dailyParams = { date: dailyDate };
  const rangeParams = { from: rangeFrom, to: rangeTo };

  const { data: dailyReport, isLoading: loadingDaily } = useGetDailyReport(dailyParams, { query: { queryKey: getGetDailyReportQueryKey(dailyParams), enabled: reportType === "daily" && !!dailyDate } });
  const { data: rangeReport, isLoading: loadingRange } = useGetRangeReport(rangeParams, { query: { queryKey: getGetRangeReportQueryKey(rangeParams), enabled: reportType === "range" && !!rangeFrom && !!rangeTo } });

  const activeReport = reportType === "daily" ? dailyReport : rangeReport;
  const isLoading = reportType === "daily" ? loadingDaily : loadingRange;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Stock Reports</h1>
          <p className="text-muted-foreground mt-1">Export and analyze stock usage.</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> Print PDF
        </Button>
      </div>

      <Card className="no-print shadow-sm">
        <CardHeader className="pb-4">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="daily">Daily Report</TabsTrigger>
              <TabsTrigger value="range">Range Report</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {reportType === "daily" ? (
            <div className="flex items-end gap-4 max-w-sm">
              <div className="space-y-2 flex-1">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={dailyDate} 
                  onChange={(e) => setDailyDate(e.target.value)} 
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-4 max-w-xl">
              <div className="space-y-2 flex-1">
                <Label htmlFor="from">From Date</Label>
                <Input 
                  id="from" 
                  type="date" 
                  value={rangeFrom} 
                  onChange={(e) => setRangeFrom(e.target.value)} 
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="to">To Date</Label>
                <Input 
                  id="to" 
                  type="date" 
                  value={rangeTo} 
                  onChange={(e) => setRangeTo(e.target.value)} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Area */}
      <div className="print-area bg-card rounded-lg border shadow-sm print:shadow-none print:border-none">
        <div className="p-6 border-b print:border-black/20">
          <h2 className="text-2xl font-bold font-serif text-primary print:text-black">
            ROYAL KARAHI INVENTORY REPORT
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-2 font-medium">
            <Calendar className="h-4 w-4" />
            {reportType === "daily" 
              ? `Daily Report: ${dailyDate}` 
              : `Range Report: ${rangeFrom} to ${rangeTo}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6 bg-muted/30 print:bg-transparent border-b print:border-black/20">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total In</p>
            <p className="text-2xl font-bold text-foreground print:text-black">
              {isLoading ? "..." : activeReport?.summary?.totalIn || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Out</p>
            <p className="text-2xl font-bold text-destructive">
              {isLoading ? "..." : activeReport?.summary?.totalOut || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground print:text-black">
              {isLoading ? "..." : activeReport?.summary?.totalTransactions || 0}
            </p>
          </div>
        </div>

        <div className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 print:bg-transparent">
              <TableRow className="print:border-black/20">
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
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
                      <span className={`font-bold ${tx.type === 'IN' ? 'text-primary print:text-black' : 'text-destructive print:text-black'}`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                    </TableCell>
                    <TableCell>{tx.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground print:text-black/70">
                      {tx.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, User, Package, ListTree, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { data: history, isLoading } = api.inventory.getMetadataHistory.useQuery({
    limit: 100
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
            <History className="h-8 w-8" />
            ADMIN AUDIT LOG
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Tracking creation and deletion of categories and items.
          </p>
        </div>
      </div>

      <Card className="shadow-2xl border-none bg-white/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Change History
              </CardTitle>
              <CardDescription>
                Real-time record of all structural inventory changes.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-bold border-primary/20 text-primary">
              {history?.length || 0} Total Events
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Date & Time</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Type</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Action</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Entity Name</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pr-6 text-right">Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/20" />
                    </TableRow>
                  ))
                ) : history && history.length > 0 ? (
                  history.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {format(new Date(event.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-[10px] font-black uppercase text-muted-foreground/70">
                            {format(new Date(event.createdAt), "hh:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-sm ${event.entityType === 'CATEGORY' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {event.entityType === 'CATEGORY' ? <ListTree className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                          </div>
                          <span className="text-[10px] font-black tracking-widest uppercase">
                            {event.entityType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={event.action === 'CREATE' ? 'success' : 'destructive'} 
                          className={`font-black text-[9px] tracking-widest uppercase ${
                            event.action === 'CREATE' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {event.action}D
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-gray-800 tracking-tight capitalize">
                          {event.entityName}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-full border border-primary/5">
                          <User className="h-3 w-3 text-primary" />
                          <span className="text-xs font-black uppercase tracking-tight text-gray-700">
                            {event.username || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium">
                      No history events found yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, AlertCircle, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading, refetch } = api.inventory.list.useQuery({ search: search || undefined });
  const [txDialog, setTxDialog] = useState<{ isOpen: boolean; subcategoryId: number; name: string; type: "IN" | "OUT"; unit: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  
  const createTxMutation = api.inventory.logTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction recorded successfully", { duration: 2000 });
      refetch();
      setTxDialog(null);
      setQuantity("");
      setNotes("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record transaction", { duration: 2000 });
    }
  });

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDialog) return;
    
    // Frontend validation to prevent negative stock
    const item = items?.find(i => i.id === txDialog.subcategoryId);
    if (txDialog.type === "OUT" && item && Number(quantity) > item.currentStock) {
      toast.error(`Insufficient stock! Max available: ${item.currentStock.toFixed(2)} ${item.unit}`, { duration: 2000 });
      return;
    }

    createTxMutation.mutate({ 
      subcategoryId: txDialog.subcategoryId, 
      type: txDialog.type, 
      quantity: Number(quantity),
      notes: notes.trim() || undefined
    });
  };

  // Group items by category
  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.categoryName]) {
      acc[item.categoryName] = [];
    }
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof items>) || {};

  const toggleCategory = (cat: string) => {
    setActiveCategory(prev => (prev === cat ? null : cat));
  };

  // Auto-expand first matching category on search
  useEffect(() => {
    if (search.trim() && items && Object.keys(groupedItems).length > 0) {
      const firstCategory = Object.keys(groupedItems).sort()[0];
      if (firstCategory) {
        setActiveCategory(firstCategory);
      }
    }
  }, [search, items]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Stock Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage kitchen stock quantities.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : Object.keys(groupedItems).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => {
            const isExpanded = activeCategory === category;
            const lowStockInCat = catItems.some(i => i.isLowStock);
            const unit = catItems[0]?.unit;

            return (
              <div key={category} className="group border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <button 
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors",
                    isExpanded ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1 rounded-md transition-transform duration-300",
                      isExpanded ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                      <ChevronDown className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {category}
                        {lowStockInCat && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{unit}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{catItems.length} items</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={lowStockInCat ? "destructive" : "secondary"} className="hidden sm:flex">
                    {catItems.length} {catItems.length === 1 ? 'Item' : 'Items'}
                  </Badge>
                </button>

                <div className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                  <div className="overflow-hidden">
                    <div className="p-4 md:p-6 bg-muted/10 border-t">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {catItems.map(item => (
                          <Card key={item.id} className={cn(
                            "shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-2 bg-card",
                            item.isLowStock ? 'border-destructive/20' : 'border-transparent'
                          )}>
                            <CardContent className="p-0 flex flex-col h-full">
                              <div className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="space-y-0.5">
                                    <h3 className="font-bold text-lg leading-tight flex items-center gap-2 text-foreground">
                                      {item.name}
                                      {item.isLowStock && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {item.id}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant={item.isLowStock ? "destructive" : "outline"} className="font-mono text-base px-2 py-0.5">
                                      {Number(item.currentStock).toFixed(2)}
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Stock ({item.unit})</span>
                                  </div>
                                </div>
                                
                                <div className="mt-auto pt-4 border-t border-primary/5">
                                  <div className="bg-muted/30 rounded-lg p-2 border border-border/50 shadow-inner">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-bold text-[10px] h-8"
                                        onClick={() => setTxDialog({ isOpen: true, subcategoryId: item.id, name: item.name, type: "OUT", unit: item.unit })}
                                      >
                                        <Minus className="mr-1 h-3 w-3" /> Usage
                                      </Button>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        className="w-full bg-primary hover:bg-primary/90 shadow-sm font-bold text-[10px] h-8"
                                        onClick={() => setTxDialog({ isOpen: true, subcategoryId: item.id, name: item.name, type: "IN", unit: item.unit })}
                                      >
                                        <Plus className="mr-1 h-3 w-3" /> Restock
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
          No inventory items found.
        </div>
      )}

      <Dialog open={txDialog?.isOpen} onOpenChange={(open) => !open && setTxDialog(null)}>
        <DialogContent className="text-gray-800">
          <form onSubmit={handleTransaction}>
            <DialogHeader>
              <DialogTitle>
                {txDialog?.type === "IN" ? "Restock" : "Record Usage"}: {txDialog?.name}
              </DialogTitle>
              <DialogDescription>
                {txDialog?.type === "IN" 
                  ? "Add new stock inventory items to the system." 
                  : "Record kitchen usage or consumption of this item from stock."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-6">
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantity ({txDialog?.unit})</Label>
                {txDialog?.type === "OUT" && (
                  <div className="text-[10px] items-center flex gap-1 text-muted-foreground font-bold uppercase mb-1">
                    <AlertCircle className="h-3 w-3" /> Max Available: {Number(items?.find(i => i.id === txDialog.subcategoryId)?.currentStock || 0).toFixed(2)} {txDialog.unit}
                  </div>
                )}
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., Supplier name, reason for usage..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTxDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTxMutation.isPending}>
                {createTxMutation.isPending ? "Saving..." : "Confirm Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


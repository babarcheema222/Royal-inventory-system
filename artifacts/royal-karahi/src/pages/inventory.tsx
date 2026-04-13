import { useState } from "react";
import { useListInventory, useCreateTransaction, getListInventoryQueryKey, useListSuppliers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Search, AlertCircle, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useListInventory({ search });
  const { data: suppliers } = useListSuppliers();
  const [txDialog, setTxDialog] = useState<{ isOpen: boolean; subcategoryId: number; name: string; type: "IN" | "OUT"; unit: string } | null>(null);

  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");

  const createTxMutation = useCreateTransaction();
  const queryClient = useQueryClient();

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDialog) return;

    createTxMutation.mutate(
      {
        data: {
          subcategoryId: txDialog.subcategoryId,
          type: txDialog.type,
          quantity: Number(quantity),
          notes: notes.trim() || undefined,
          supplierId: txDialog.type === "IN" && supplierId ? Number(supplierId) : undefined
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          setTxDialog(null);
          setQuantity("");
          setNotes("");
          setSupplierId("");
        }
      }
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <Card key={item.id} className={`shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-none bg-gradient-to-br from-card to-muted/10 items-stretch flex flex-col ${item.isLowStock ? 'ring-2 ring-destructive/30' : ''}`}>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-xl leading-tight flex items-center gap-2 text-foreground">
                        {item.name}
                        {item.isLowStock && <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />}
                      </h3>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">{item.categoryName} ({item.unit})</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={item.isLowStock ? "destructive" : "secondary"} className="font-mono text-lg px-3 py-1 shadow-sm">
                        {item.currentStock} {item.unit}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Current Count</span>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-primary/5">
                    <Button
                      variant="outline"
                      className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-bold"
                      onClick={() => setTxDialog({ isOpen: true, subcategoryId: item.id, name: item.name, type: "OUT", unit: item.unit })}
                    >
                      <Minus className="mr-2 h-4 w-4" /> Usage
                    </Button>
                    <Button
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 shadow-sm font-bold"
                      onClick={() => setTxDialog({ isOpen: true, subcategoryId: item.id, name: item.name, type: "IN", unit: item.unit })}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Restock
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
          No inventory items found.
        </div>
      )}

      <Dialog open={txDialog?.isOpen} onOpenChange={(open) => !open && setTxDialog(null)}>
        <DialogContent>
          <form onSubmit={handleTransaction}>
            <DialogHeader>
              <DialogTitle>
                {txDialog?.type === "IN" ? "Add Stock" : "Use Stock"}: {txDialog?.name}
              </DialogTitle>
              <DialogDescription>
                Record {txDialog?.type === "IN" ? "incoming delivery" : "kitchen usage"} for this item.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity ({txDialog?.unit})</Label>
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
              {txDialog?.type === "IN" && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <select
                    id="supplier"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">Select Supplier (Optional)</option>
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., reason for usage..."
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

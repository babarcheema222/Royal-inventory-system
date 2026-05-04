"use client";

import React, { useState, useMemo } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ClipboardList, Package, Trash2, Download, Eye, AlertCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdf-generator";
import { useAuth } from "@/lib/auth";

interface DemandItemDraft {
  subcategoryId?: number;
  itemName: string;
  categoryName: string;
  unit: string;
  quantity: number;
  currentStock?: number;
  comment?: string;
  isCustom: boolean;
}

export default function DemandPage() {
  const { user, isAdmin, isAnyAdmin } = useAuth();
  const utils = api.useUtils();

  // Queries
  const { data: demands, isLoading: loadingDemands } = api.demand.list.useQuery(undefined, {
    enabled: isAnyAdmin,
  });
  const { data: inventoryItems } = api.inventory.list.useQuery({}, {
    enabled: isAnyAdmin,
  });

  // Mutations
  const createDemandMutation = api.demand.create.useMutation({
    onSuccess: () => {
      toast.success("Demand created successfully!");
      setIsAddModalOpen(false);
      setDraftItems([]);
      utils.demand.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const deleteDemandMutation = api.demand.delete.useMutation({
    onSuccess: () => {
      toast.success("Demand deleted successfully");
      setIsDetailsModalOpen(false);
      utils.demand.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  // State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDemandId, setSelectedDemandId] = useState<number | null>(null);
  const { data: selectedDemand } = api.demand.getById.useQuery(
    { id: selectedDemandId as number },
    { enabled: !!selectedDemandId }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [draftItems, setDraftItems] = useState<DemandItemDraft[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // New Custom Item Form State
  const [customItemName, setCustomItemName] = useState("");
  const [customItemUnit, setCustomItemUnit] = useState("Units");
  const [customItemQuantity, setCustomItemQuantity] = useState("");

  // Filtered inventory for search
  const filteredInventory = useMemo(() => {
    if (!inventoryItems || !searchQuery) return [];
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Limit search results
  }, [inventoryItems, searchQuery]);

  const addToDraft = (item: any) => {
    // Avoid duplicates if inventory item
    if (draftItems.find(d => d.subcategoryId === item.id)) {
      toast.error("Item already in demand list");
      return;
    }
    setDraftItems([...draftItems, {
      subcategoryId: item.id,
      itemName: item.name,
      categoryName: item.categoryName || "Uncategorized",
      unit: item.unit,
      quantity: 1,
      currentStock: item.currentStock,
      isCustom: false
    }]);
    setSearchQuery("");
    toast.success(`${item.name} added to list`);
  };

  const addCustomToDraft = () => {
    if (!customItemName || !customItemQuantity) return;
    setDraftItems([...draftItems, {
      itemName: customItemName,
      categoryName: "Non-inventory Item",
      unit: customItemUnit,
      quantity: Number(customItemQuantity),
      isCustom: true
    }]);
    setCustomItemName("");
    setCustomItemQuantity("");
    setIsAddingCustom(false);
    toast.success("Custom item added");
  };

  const removeFromDraft = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  const updateDraftQuantity = (index: number, val: string) => {
    const newDraft = [...draftItems];
    newDraft[index]!.quantity = Number(val);
    setDraftItems(newDraft);
  };

  const updateDraftComment = (index: number, val: string) => {
    const newDraft = [...draftItems];
    newDraft[index]!.comment = val;
    setDraftItems(newDraft);
  };

  const handleSaveDemand = () => {
    if (draftItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    createDemandMutation.mutate({ items: draftItems });
  };

  const downloadDemandPDF = (demand: any) => {
    if (!demand) return;

    const head = [["Item Name", "Category", "Quantity", "Current Stock", "Comment"]];
    const body = demand.items.map((item: any) => [
      item.isCustom ? `${item.itemName} (Custom)` : item.itemName,
      item.categoryName,
      `${item.quantity} ${item.unit}`,
      item.isCustom ? "-" : `${Number(item.currentStock).toFixed(item.unit === "Kg" ? 3 : 2)} ${item.unit}`,
      item.comment || "-"
    ]);

    generatePDF({
      title: `Inventory Demand Request #${demand.id}`,
      subtitle: `Requested By: ${demand.requesterName} | Date: ${format(new Date(demand.createdAt), "PPP")}`,
      fileName: `ROYAL DEMAND ${format(new Date(demand.createdAt), "dd-MM-yyyy")}.pdf`,
      head,
      body,
      showSignature: true
    });
  };

  if (!isAnyAdmin) return null;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8" /> Demand Module
          </h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg font-medium">Create and track inventory requests</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90 font-bold gap-2">
          <Plus className="w-5 h-5" /> Add Demand
        </Button>
      </div>

      {/* OVERVIEW TABLE */}
      <Card className="shadow-lg border-none bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Recent Demands
          </CardTitle>
          <CardDescription>View history of all demand requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDemands ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse font-bold">Loading demands...</div>
          ) : demands && demands.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Requester</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demands.map((demand) => (
                  <TableRow key={demand.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs">#{demand.id}</TableCell>
                    <TableCell className="font-semibold">{demand.requesterName}</TableCell>
                    <TableCell className="text-sm">{format(new Date(demand.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => { setSelectedDemandId(demand.id); setIsDetailsModalOpen(true); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // This is a quick fetch-and-download
                          // In a real app, you might want to fetch details then download
                          // But we'll just open the modal first for now
                          setSelectedDemandId(demand.id);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-2 text-gray-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black uppercase">Delete Demand Entry?</AlertDialogTitle>
                              <AlertDialogDescription className="font-bold">
                                This will permanently remove Demand #{demand.id} from the system. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-bold uppercase rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteDemandMutation.mutate({ id: demand.id })}
                                className="bg-destructive text-white hover:bg-destructive/90 font-bold uppercase rounded-xl"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No demands found.</p>
              <p className="text-sm">Click "Add Demand" to create your first request.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD DEMAND DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden text-gray-800">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" /> Create Inventory Demand
            </DialogTitle>
            <DialogDescription className="font-bold">
              Build your request list by selecting items from inventory or adding custom items.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
            {/* ITEM SEARCH SECTION */}
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search existing inventory items..." 
                  className="pl-11 h-12 text-lg border-2 focus:ring-primary/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {searchQuery && filteredInventory.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-2xl overflow-hidden divide-y">
                    {filteredInventory.map(item => (
                      <div 
                        key={item.id} 
                        className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group/item"
                        onClick={() => addToDraft(item)}
                      >
                        <div>
                          <p className="font-bold text-gray-800 group-hover/item:text-primary">{item.name}</p>
                          <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{item.categoryName} • {item.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-primary">Stock: {Number(item.currentStock).toFixed(item.unit === "Kg" ? 3 : 2)}</p>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">Add to list</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && filteredInventory.length === 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-2xl p-6 text-center">
                    <p className="text-muted-foreground mb-2">No matching items found in inventory.</p>
                    <Button variant="outline" size="sm" onClick={() => { setIsAddingCustom(true); setSearchQuery(""); }} className="font-bold">
                      Add as Custom Item instead?
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-dashed border-primary/20">
                <p className="text-sm font-bold text-muted-foreground">Can't find an item? Add it manually:</p>
                <Button variant="outline" size="sm" onClick={() => setIsAddingCustom(true)} className="font-bold border-primary/20 hover:bg-primary/5">
                  <Plus className="w-4 h-4 mr-1" /> Custom Item
                </Button>
              </div>
            </div>

            {/* CUSTOM ITEM FORM (TOGGLED) */}
            {isAddingCustom && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Item Name</label>
                      <Input placeholder="e.g. Plastic Bags" value={customItemName} onChange={e => setCustomItemName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Unit Type</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={customItemUnit}
                        onChange={e => setCustomItemUnit(e.target.value)}
                      >
                        <option value="Units">Units</option>
                        <option value="Kg">Kg</option>
                        <option value="Litre">Litre</option>
                        <option value="Pieces">Pieces</option>
                        <option value="Pack">Pack</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Initial Qty</label>
                      <Input type="number" placeholder="0" value={customItemQuantity} onChange={e => setCustomItemQuantity(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingCustom(false)}>Cancel</Button>
                    <Button size="sm" onClick={addCustomToDraft} disabled={!customItemName || !customItemQuantity} className="font-bold">Add to List</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DRAFT ITEMS TABLE */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-1">Demand List ({draftItems.length} items)</h3>
              {draftItems.length > 0 ? (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-bold">Item & Category</TableHead>
                        <TableHead className="font-bold text-center w-24">Quantity</TableHead>
                        <TableHead className="font-bold">Comment</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftItems.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/5 group">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 flex items-center gap-1">
                                {item.itemName} 
                                {item.isCustom && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 uppercase leading-none">Custom</Badge>}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                                {item.categoryName} • Unit: {item.unit}
                                {!item.isCustom && ` • Stock: ${Number(item.currentStock).toFixed(item.unit === "Kg" ? 3 : 2)}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              step={item.unit === "Kg" ? "0.001" : "1"} 
                              value={item.quantity} 
                              onChange={(e) => updateDraftQuantity(idx, e.target.value)}
                              className="h-8 text-center font-bold border-primary/20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Add note..." 
                              value={item.comment || ""} 
                              onChange={(e) => updateDraftComment(idx, e.target.value)}
                              className="h-8 text-xs border-primary/10"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromDraft(idx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                  <p className="font-medium text-sm">Your demand list is empty.</p>
                  <p className="text-[10px] uppercase font-black tracking-widest mt-1">Search and add items above</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t flex items-center justify-between sm:justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground max-w-[200px]">
              Records are immutable after save. Review carefully.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSaveDemand} 
                disabled={draftItems.length === 0 || createDemandMutation.isPending}
                className="bg-primary font-bold px-8 shadow-lg shadow-primary/20"
              >
                {createDemandMutation.isPending ? "Saving..." : "Save Demand Request"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAILS DIALOG */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden text-gray-800">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-start pr-8">
              <div>
                <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                  <Package className="w-6 h-6" /> Demand Details #{selectedDemand?.id}
                </DialogTitle>
                <DialogDescription className="font-bold">
                  Created by {selectedDemand?.requesterName} on {selectedDemand && format(new Date(selectedDemand.createdAt), "PPP p")}
                </DialogDescription>
              </div>
              <Button onClick={() => downloadDemandPDF(selectedDemand)} className="bg-primary hover:bg-primary/90 font-bold shrink-0 shadow-lg shadow-primary/10">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 font-bold shrink-0">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-2 text-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black uppercase">Permanently Delete Demand?</AlertDialogTitle>
                      <AlertDialogDescription className="font-bold">
                        You are about to delete Demand #{selectedDemand?.id}. All associated item requests will be lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-bold uppercase rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => selectedDemand && deleteDemandMutation.mutate({ id: selectedDemand.id })}
                        className="bg-destructive text-white hover:bg-destructive/90 font-bold uppercase rounded-xl"
                      >
                        Delete Now
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedDemand ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse">Loading details...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-primary/10">
                  <div className="h-10 w-px bg-primary/10 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Items</span>
                    <span className="text-lg font-bold text-primary">{selectedDemand.items.length}</span>
                  </div>
                  <div className="h-10 w-px bg-primary/10 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date Created</span>
                    <span className="text-sm font-bold text-gray-700">{format(new Date(selectedDemand.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-bold">Item</TableHead>
                        <TableHead className="font-bold">Category</TableHead>
                        <TableHead className="text-right font-bold">Req. Quantity</TableHead>
                        <TableHead className="font-bold">Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDemand.items.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-muted/5">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 flex items-center gap-1">
                                {item.itemName} 
                                {item.isCustom && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 uppercase leading-none">Custom</Badge>}
                              </span>
                              {!item.isCustom && (
                                <span className="text-[9px] font-black uppercase text-muted-foreground">Snapshot Stock: {Number(item.currentStock).toFixed(item.unit === "Kg" ? 3 : 2)} {item.unit}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs uppercase font-bold text-muted-foreground tracking-tighter">{item.categoryName}</TableCell>
                          <TableCell className="text-right font-black text-primary text-base">
                            {item.quantity} <span className="text-[10px] uppercase font-bold text-muted-foreground ml-0.5">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-xs italic text-muted-foreground max-w-[200px] truncate" title={item.comment || ""}>
                            {item.comment || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/10 rounded-lg border border-dashed text-muted-foreground">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed font-medium italic">
                    Note: Records for Demand requests are permanent for Manager accounts to ensure data integrity. 
                    Contact the Super Admin if you need to rectify a mistake in a submitted request.
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

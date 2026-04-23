"use client";

import { useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function Categories() {
  const { data: categories, isLoading, refetch } = api.inventory.getCategories.useQuery();
  const utils = api.useUtils();

  const createCatMutation = api.inventory.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Category created", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
      setNewCatName("");
      setNewCatUnit("Kg");
    }
  });

  const deleteCatMutation = api.inventory.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Category deleted", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
    }
  });

  const createSubMutation = api.inventory.createSubcategory.useMutation({
    onSuccess: () => {
      toast.success("Item added", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
    }
  });

  const deleteSubMutation = api.inventory.deleteSubcategory.useMutation({
    onSuccess: () => {
      toast.success("Item deleted", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
    }
  });

  const updateCatMutation = api.inventory.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Category updated", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
      setEditModal(null);
    }
  });

  const updateSubMutation = api.inventory.updateSubcategory.useMutation({
    onSuccess: () => {
      toast.success("Item updated", { duration: 1500 });
      utils.inventory.getCategories.invalidate();
      setEditModal(null);
    }
  });

  const [editModal, setEditModal] = useState<{ isOpen: boolean; type: 'category' | 'subcategory'; id: number; name: string } | null>(null);
  const [editName, setEditName] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newCatUnit, setNewCatUnit] = useState("Kg");
  const [newSubNames, setNewSubNames] = useState<Record<number, string>>({});

  const commonUnits = ["Kg", "Liters", "Pieces", "Packs", "Bags", "Boxes", "Other"];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createCatMutation.mutate({ name: newCatName.trim(), unit: newCatUnit });
  };

  const handleCreateSubcategory = (e: React.FormEvent, categoryId: number) => {
    e.preventDefault();
    const name = newSubNames[categoryId]?.trim();
    if (!name) return;

    createSubMutation.mutate({ categoryId, name }, {
      onSuccess: () => {
        setNewSubNames(prev => ({ ...prev, [categoryId]: "" }));
      }
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category and all its items?")) {
      deleteCatMutation.mutate({ id });
    }
  };

  const handleDeleteSubcategory = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteSubMutation.mutate({ id });
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !editName.trim()) return;
    
    if (editModal.type === 'category') {
      updateCatMutation.mutate({ id: editModal.id, name: editName.trim() });
    } else {
      updateSubMutation.mutate({ id: editModal.id, name: editName.trim() });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Category Management</h1>
        <p className="text-muted-foreground mt-1">Organize Royal Karahi inventory structure.</p>
      </div>

      <Card className="shadow-sm text-gray-800">
        <CardHeader className="pb-4">
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a category and define its unit (e.g., Meats - Kg, Dairy - Liters)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="catName" className="mb-2 block">Category Name</Label>
              <Input
                id="catName"
                name="categoryName"
                autoComplete="off"
                placeholder="e.g., Meats, Vegetables"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                aria-required="true"
                disabled={createCatMutation.isPending}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="catUnit" className="mb-2 block">Measurement Unit</Label>
              <select
                id="catUnit"
                name="categoryUnit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newCatUnit}
                onChange={(e) => setNewCatUnit(e.target.value)}
                disabled={createCatMutation.isPending}
              >
                {commonUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="md:mt-8" disabled={createCatMutation.isPending || !newCatName.trim()} aria-label="Add Category">
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse">Loading categories...</div>
        ) : categories?.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/5">
            No categories defined yet. Create one above to get started.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {categories?.map(category => (
              <Card key={category.id} className="shadow-sm flex flex-col text-gray-800">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <p className="text-xs font-bold text-primary uppercase tracking-tighter">Unit: {(category as any).unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditModal({ isOpen: true, type: 'category', id: category.id, name: category.name });
                        setEditName(category.name);
                      }}
                      title="Edit Category"
                      aria-label="Edit Category"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteCatMutation.isPending}
                      title="Delete Category"
                      aria-label="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="space-y-2 mb-6 flex-1">
                    {(category as any).subcategories && (category as any).subcategories.length > 0 ? (
                      (category as any).subcategories.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/10 transition-colors">
                          <span className="font-medium text-sm">{sub.name} <span className="text-[10px] text-muted-foreground uppercase">({(category as any).unit})</span></span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditModal({ isOpen: true, type: 'subcategory', id: sub.id, name: sub.name });
                                setEditName(sub.name);
                              }}
                              aria-label="Edit Item"
                              title="Edit Item"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                              disabled={deleteSubMutation.isPending}
                              aria-label="Delete Item"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground font-bold text-center py-4">No items in this category.</p>
                    )}
                  </div>

                  <form onSubmit={(e) => handleCreateSubcategory(e, category.id)} className="mt-auto">
                    <div className="flex gap-2">
                      <Label htmlFor={`subName-${category.id}`} className="sr-only">New Item Name</Label>
                      <Input
                        id={`subName-${category.id}`}
                        name="subcategoryName"
                        autoComplete="off"
                        placeholder={`New item name...`}
                        className="flex-1"
                        value={newSubNames[category.id] || ""}
                        onChange={(e) => setNewSubNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                        disabled={createSubMutation.isPending}
                        required
                        aria-required="true"
                      />
                      <Button type="submit" variant="secondary" size="icon" disabled={!newSubNames[category.id]?.trim() || createSubMutation.isPending} aria-label="Add Item" title="Add Item">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editModal?.isOpen} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent className="text-gray-800">
          <form onSubmit={handleEditSave}>
            <DialogHeader>
              <DialogTitle>
                Edit {editModal?.type === 'category' ? 'Category' : 'Item'}
              </DialogTitle>
              <DialogDescription>
                Update the name and click save to apply changes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="space-y-2">
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter new name"
                  required
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCatMutation.isPending || updateSubMutation.isPending || !editName.trim()}>
                {(updateCatMutation.isPending || updateSubMutation.isPending) ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

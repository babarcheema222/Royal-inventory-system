import { useState } from "react";
import { 
  useListCategories, 
  useCreateCategory, 
  useDeleteCategory, 
  useCreateSubcategory, 
  useDeleteSubcategory,
  getListCategoriesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();
  const queryClient = useQueryClient();
  
  const createCatMutation = useCreateCategory();
  const deleteCatMutation = useDeleteCategory();
  const createSubMutation = useCreateSubcategory();
  const deleteSubMutation = useDeleteSubcategory();

  const [newCatName, setNewCatName] = useState("");
  const [newSubNames, setNewSubNames] = useState<Record<number, string>>({});

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    createCatMutation.mutate(
      { data: { name: newCatName.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setNewCatName("");
        }
      }
    );
  };

  const handleCreateSubcategory = (e: React.FormEvent, categoryId: number) => {
    e.preventDefault();
    const name = newSubNames[categoryId]?.trim();
    if (!name) return;

    createSubMutation.mutate(
      { data: { categoryId, name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setNewSubNames(prev => ({ ...prev, [categoryId]: "" }));
        }
      }
    );
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category and all its items?")) {
      deleteCatMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() })
      });
    }
  };

  const handleDeleteSubcategory = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteSubMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() })
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Category Management</h1>
        <p className="text-muted-foreground mt-1">Organize your inventory structure.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a top-level group (e.g., Meats, Vegetables, Spices)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="flex gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Category Name" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={createCatMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={createCatMutation.isPending || !newCatName.trim()}>
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-muted-foreground">Loading categories...</div>
        ) : categories?.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
            No categories defined yet. Create one above to get started.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {categories?.map(category => (
              <Card key={category.id} className="shadow-sm flex flex-col">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteCategory(category.id)}
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="space-y-2 mb-6 flex-1">
                    {category.subcategories.length > 0 ? (
                      category.subcategories.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                          <span className="font-medium">{sub.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteSubcategory(sub.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No items in this category.</p>
                    )}
                  </div>

                  <form onSubmit={(e) => handleCreateSubcategory(e, category.id)} className="mt-auto">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New item name..." 
                        size={1}
                        className="flex-1"
                        value={newSubNames[category.id] || ""}
                        onChange={(e) => setNewSubNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                      />
                      <Button type="submit" variant="secondary" size="icon" disabled={!newSubNames[category.id]?.trim() || createSubMutation.isPending}>
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
    </div>
  );
}

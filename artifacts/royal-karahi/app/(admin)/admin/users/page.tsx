"use client";

import { useState } from "react";
import { api } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Shield, User, LayoutDashboard, Key, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Users() {
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  const { data: users, isLoading, refetch } = api.user.list.useQuery(undefined, {
    enabled: !!isAdmin
  });
  const utils = api.useUtils();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user" | "manager">("user");


  if (authLoading) {
    return <div className="p-8 text-center animate-pulse">Verifying permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Shield className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to manage staff accounts.</p>
      </div>
    );
  }
  
  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("User account created", { duration: 1500 });
      utils.user.list.invalidate();
      setUsername("");
      setPassword("");
      setRole("user");

    },
    onError: (err) => {
      toast.error(err.message || "Failed to create user", { duration: 1500 });
    }
  });

  const deleteUserMutation = api.user.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted", { duration: 1500 });
      utils.user.list.invalidate();
    }
  });

  const updatePasswordMutation = api.user.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully", { duration: 1500 });
      utils.user.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update password", { duration: 1500 });
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password is required", { duration: 1500 });
      return;
    }
    createUserMutation.mutate({ username, password, role });
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate({ id });
    }
  };

  const handleUpdatePassword = (id: number, username: string) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (newPassword && newPassword.trim() !== "") {
      updatePasswordMutation.mutate({ id, password: newPassword.trim() });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage system access for kitchen staff, managers, and administrators.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <Card className="shadow-lg border-none bg-card text-gray-800 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</Label>
                <Input 
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  aria-required="true"
                  placeholder="e.g. jdoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-medium"
                  disabled={createUserMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                <PasswordInput 
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono h-10"
                  disabled={createUserMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Level</Label>
                <Select value={role} onValueChange={(v: "admin" | "user" | "manager") => setRole(v)} disabled={createUserMutation.isPending}>
                  <SelectTrigger id="role" name="role" className="font-medium" aria-label="Access Level">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user" className="font-medium">Staff (Inventory Only)</SelectItem>
                    <SelectItem value="manager" className="font-medium">Manager (Full App Access)</SelectItem>
                    <SelectItem value="admin" className="font-medium">Admin (System Control)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-4 font-bold uppercase tracking-wide" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-card text-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Active Personnel</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold">Username</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Created Date</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground animate-pulse">Retrieving staff records...</TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No personnel records found.</TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-bold text-primary">{u.username}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={u.role === 'admin' ? 'default' : u.role === 'manager' ? 'secondary' : 'outline'} 
                          className="gap-1 font-bold uppercase text-[10px] tracking-tighter"
                        >
                          {u.role === 'admin' ? <Shield className="h-3 w-3" /> : u.role === 'manager' ? <LayoutDashboard className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {u.role === 'user' ? 'Staff' : u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right px-4 space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={deleteUserMutation.isPending || String(u.id) === currentUser?.id}
                          title={String(u.id) === currentUser?.id ? "Cannot delete yourself" : "Delete User"}
                          aria-label={String(u.id) === currentUser?.id ? "Cannot delete yourself" : "Delete User"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

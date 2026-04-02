import { useState } from "react";
import { 
  useListUsers, 
  useCreateUser, 
  useDeleteUser, 
  getListUsersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(
      { data: { username, password, role } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setUsername("");
          setPassword("");
          setRole("user");
        }
      }
    );
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground mt-1">Manage system access for kitchen staff and administrators.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card className="shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v: "admin" | "user") => setRole(v)} disabled={createUserMutation.isPending}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Staff (Inventory only)</SelectItem>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createUserMutation.isError && (
                <div className="text-sm text-destructive mt-2">
                  Failed to create user. Username may already exist.
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={createUserMutation.isPending}>
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                          {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
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

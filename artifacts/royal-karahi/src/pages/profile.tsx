import { useState, useEffect } from "react";
import { useGetMe, useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Shield, Calendar, Mail, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { data: user, isLoading } = useGetMe();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setSuccessMsg("");

    if (password && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    updateProfileMutation.mutate(
      {
        data: {
          email: email || undefined,
          password: password || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setSuccessMsg("Profile updated successfully!");
          setPassword("");
          setConfirmPassword("");
        },
        onError: (error: any) => {
          setPasswordError(error.response?.data?.error || "Failed to update profile.");
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-destructive">Failed to load profile.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Profile</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your account credentials and personal information.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Read-only Information Card */}
        <Card className="shadow-lg border-none bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-serif">
              <UserCircle className="w-6 h-6 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>This information is managed by system administrators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">Username</Label>
              <div className="font-medium text-lg font-mono">{user.username}</div>
            </div>

            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">Role</Label>
              <div className="flex">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1 mt-1">
                  {user.role === 'admin' ? <Shield className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">Member Since</Label>
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mutable Information Card */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Security Settings</CardTitle>
            <CardDescription>Update your email address or change your system password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={updateProfileMutation.isPending}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={updateProfileMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updateProfileMutation.isPending}
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">
                  {passwordError}
                </div>
              )}
              {successMsg && (
                <div className="text-sm text-primary font-medium bg-primary/10 p-2 rounded">
                  {successMsg}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

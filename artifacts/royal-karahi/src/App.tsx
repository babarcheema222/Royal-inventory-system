import { Switch, Route } from "wouter";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Categories from "@/pages/admin/categories";
import Reports from "@/pages/admin/reports";
import Users from "@/pages/admin/users";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function ProtectedUserRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedAdminRoute component={Dashboard} />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedAdminRoute component={Dashboard} />} />
      <Route path="/inventory" component={() => <ProtectedUserRoute component={Inventory} />} />
      <Route path="/profile" component={() => <ProtectedUserRoute component={Profile} />} />
      <Route path="/admin/categories" component={() => <ProtectedAdminRoute component={Categories} />} />
      <Route path="/admin/reports" component={() => <ProtectedAdminRoute component={Reports} />} />
      <Route path="/admin/users" component={() => <ProtectedAdminRoute component={Users} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;

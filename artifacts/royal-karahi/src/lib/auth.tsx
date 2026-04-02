import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, LoginResponse } from "@workspace/api-client-react.schemas";
import { useLocation } from "wouter";

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("rk_token"));
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Interceptor setup
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const currentToken = localStorage.getItem("rk_token");
      if (currentToken && typeof input === "string" && input.includes("/api/")) {
        init = init || {};
        init.headers = { 
          ...(init.headers as Record<string, string> || {}), 
          "Authorization": `Bearer ${currentToken}` 
        };
      }
      return originalFetch(input, init);
    };

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          username: payload.username,
          role: payload.role,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to parse JWT", e);
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (data: LoginResponse) => {
    localStorage.setItem("rk_token", data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.user.role === 'admin') {
      setLocation("/dashboard");
    } else {
      setLocation("/inventory");
    }
  };

  const logout = () => {
    localStorage.removeItem("rk_token");
    setToken(null);
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService, tokenService, userService, User } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Set mounted state first
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user and token from localStorage on mount
  useEffect(() => {
    if (!mounted) return;

    const loadAuth = async () => {
      try {
        const storedToken = tokenService.getToken();
        const storedUser = userService.getUser();

        if (storedToken && storedUser) {
          // Set immediately to prevent white flash
          setToken(storedToken);
          setUser(storedUser);
          setLoading(false); // Set loading false immediately with cached data

          // Then verify in background
          try {
            const response = await authService.getUserInfo(storedToken);
            if (response.success && response.data) {
              setUser(response.data);
              userService.setUser(response.data);
            } else {
              // Token is invalid, clear everything
              handleLogout();
            }
          } catch (error) {
            console.error("Failed to verify token:", error);
            handleLogout();
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load auth:", error);
        setLoading(false);
      }
    };

    loadAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        // Save to state
        setToken(newToken);
        setUser(newUser);

        // Save to localStorage
        tokenService.setToken(newToken);
        userService.setUser(newUser);

        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: response.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    userService.clearAll();
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      handleLogout();
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await authService.getUserInfo(token);
      if (response.success && response.data) {
        setUser(response.data);
        userService.setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC untuk protect routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/login"
) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

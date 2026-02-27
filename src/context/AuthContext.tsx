/**
 * AUTOMALL - Authentication Context & Hooks
 * Manages user authentication state globally
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Customer' | 'Staff' | 'Admin';
  phone_number?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role?: 'Customer' | 'Staff';
}

// Base URL for backend API
// For XAMPP Apache at C:\xampp\htdocs\automall proj this resolves to
//   http://localhost/automall%20proj/backend/api
const API_BASE = import.meta.env.VITE_API_BASE || '/automall%20proj/backend/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('automall_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch {
        localStorage.removeItem('automall_user');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // Debug: read raw response to detect non-JSON HTML error pages
      const rawText = await response.text();
      let data: any;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error('Login API returned non-JSON response', {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          bodyPreview: rawText.slice(0, 500),
        });
        throw new Error(
          `Login endpoint did not return JSON (status ${response.status}). Body starts with: ${rawText
            .replace(/\s+/g, ' ')
            .slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const userData: User = {
        user_id: data.data.user_id,
        email: data.data.email,
        first_name: data.data.first_name,
        last_name: data.data.last_name,
        role: data.data.role,
        phone_number: data.data.phone_number,
        token: data.data.token,
      };

      setUser(userData);
      localStorage.setItem('automall_user', JSON.stringify(userData));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Debug: read raw response to detect non-JSON HTML error pages
      const rawText = await response.text();
      let result: any;
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error('Register API returned non-JSON response', {
          status: response.status,
          statusText: response.statusText,
          bodyPreview: rawText.slice(0, 500),
        });
        throw new Error(
          `Register endpoint did not return JSON (status ${response.status}). Body starts with: ${rawText
            .replace(/\s+/g, ' ')
            .slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      const userData: User = {
        user_id: result.data.user_id,
        email: result.data.email,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        role: result.data.role,
        token: result.data.token,
      };

      setUser(userData);
      localStorage.setItem('automall_user', JSON.stringify(userData));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('automall_user');
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem('automall_user', JSON.stringify(next));
      return next;
    });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Role = 'admin' | 'staff' | 'member' | null;

type User = {
  id?: string;
  email?: string;
  role: Role;
  name?: string;
  token?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (role: Exclude<Role, null>, name?: string, details?: { id?: string; email?: string; token?: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'desk_atlas_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.role === 'admin') {
            return parsed;
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role === 'admin') {
          setUser(parsed);
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (role: Exclude<Role, null>, name?: string, details?: { id?: string; email?: string; token?: string }) => {
    const u = { role, name, ...details } as User;
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch (e) {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { Role, User };

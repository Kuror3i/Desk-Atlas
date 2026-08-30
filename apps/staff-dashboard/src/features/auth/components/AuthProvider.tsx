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
  login: (role: Exclude<Role, null>, name?: string, details?: { id?: string; email?: string; token?: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const STORAGE_KEY = 'desk_atlas_user';
  const [user, setUser] = useState<User>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
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

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { Role, User };

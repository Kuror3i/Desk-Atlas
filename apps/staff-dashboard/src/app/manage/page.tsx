"use client";

import { useAuth, Login } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';

export default function ManageRootPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }

  return <DashboardPage />;
}

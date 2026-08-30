"use client";

import { useState, useEffect, useCallback } from "react";
import type { StaffDashboardSnapshot } from "@deskatlas/domain";

export function useDashboardStats() {
  const [data, setData] = useState<StaffDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operations/dashboard");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load staff dashboard data");
      }

      const snapshot: StaffDashboardSnapshot = await res.json();
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchStats,
  };
}

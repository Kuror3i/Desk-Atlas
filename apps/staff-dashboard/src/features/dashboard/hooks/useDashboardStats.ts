"use client";

import { useState, useEffect } from 'react';
import type { OccupancyRecord, OperationalActivityRecord } from '@deskatlas/domain';

export function useDashboardStats() {
  const [occupancy, setOccupancy] = useState<OccupancyRecord[]>([]);
  const [activity, setActivity] = useState<OperationalActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [occRes, actRes] = await Promise.all([
        fetch('/api/operations/occupancy'),
        fetch('/api/operations/activity?limit=20'),
      ]);

      if (!occRes.ok) throw new Error('Failed to load occupancy data');
      if (!actRes.ok) throw new Error('Failed to load activity data');

      const occData = await occRes.json();
      const actData = await actRes.json();

      setOccupancy(occData.occupancy || []);
      setActivity(actData.activity || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { occupancy, activity, loading, error, refetch: fetchStats };
}

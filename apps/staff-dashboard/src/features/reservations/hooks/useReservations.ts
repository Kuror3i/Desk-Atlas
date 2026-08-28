"use client";

import { useState, useEffect } from 'react';
import type { StaffOperationalReservation } from '@deskatlas/domain';

export function useReservations() {
  const [reservations, setReservations] = useState<StaffOperationalReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/operations/reservations');
      if (!res.ok) {
        throw new Error('Failed to load operational reservations');
      }
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return { reservations, loading, error, refetch: fetchReservations };
}

export function useReservationDetail(id: string) {
  const { reservations, loading, error, refetch } = useReservations();
  const reservation = reservations.find(r => r.reservationId === id) || null;
  
  return {
    reservation,
    loading,
    error: !loading && !reservation && !error ? 'Reservation not found' : error,
    refetch
  };
}

"use client";

import { useState } from 'react';
import type { BookingScanResult } from '@deskatlas/domain';

export function useBookingLookup() {
  const [result, setResult] = useState<BookingScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupToken = async (token: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`/api/booking/${token}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to lookup booking');
      }
      const data = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { lookupToken, result, loading, error, clear };
}

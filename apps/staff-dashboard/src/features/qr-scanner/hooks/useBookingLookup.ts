"use client";

import { useState } from 'react';
import type { BookingScanResult } from '@deskatlas/domain';

export function extractBookingToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const segments = url.pathname.split("/").filter(Boolean);
      return segments[segments.length - 1] || "";
    }
  } catch {
    // Fall back to path split if URL parsing fails
  }

  const segments = trimmed.split("/").filter(Boolean);
  return segments[segments.length - 1] || trimmed;
}

export function useBookingLookup() {
  const [result, setResult] = useState<BookingScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupToken = async (rawInput: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const token = extractBookingToken(rawInput);
    if (!token) {
      const msg = "Invalid booking QR token.";
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }
    
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to lookup booking');
      }
      const data: BookingScanResult = await res.json();
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


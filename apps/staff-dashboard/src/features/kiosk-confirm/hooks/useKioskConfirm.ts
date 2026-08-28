"use client";

import { useState } from 'react';
import { useAuth } from '@/features/auth';
import type { PaymentReviewDecisionResult } from '@deskatlas/domain';

export function useKioskConfirm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentReviewDecisionResult | null>(null);

  const confirmPayment = async (paymentAttemptId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/payments/${paymentAttemptId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: {
            userId: 'staff-user-id',
            role: user?.role?.toUpperCase() || 'STAFF'
          }
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to confirm counter payment');
      }

      const data = await res.json();
      setResult(data.result || data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { confirmPayment, loading, error, result, reset };
}

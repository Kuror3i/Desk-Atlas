"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaymentSessionView } from "@deskatlas/domain";
import { readJson } from "@/app/lib/api";

export function usePaymentSession(token: string) {
  const [data, setData] = useState<PaymentSessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    readJson<PaymentSessionView>(`/api/pay/${encodeURIComponent(token)}`)
      .then((result) => setData(result))
      .catch((nextError) =>
        setError(nextError instanceof Error ? nextError.message : "Unable to load payment session.")
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

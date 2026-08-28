"use client";

import { useCallback, useEffect, useState } from "react";
import type { BookingScanResult } from "@deskatlas/domain";
import { readJson } from "@/app/lib/api";

export function useBookingAccess(token: string) {
  const [data, setData] = useState<BookingScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    readJson<BookingScanResult>(`/api/booking/${encodeURIComponent(token)}`)
      .then((result) => setData(result))
      .catch((nextError) =>
        setError(nextError instanceof Error ? nextError.message : "Unable to load booking.")
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

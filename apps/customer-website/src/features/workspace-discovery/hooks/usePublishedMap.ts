"use client";

import { useEffect, useState } from "react";
import type { Floor, PublishedFloorMap } from "@deskatlas/domain";
import { readJson } from "@/app/lib/api";

interface PublishedMapResponse {
  floors: Floor[];
  published: PublishedFloorMap;
}

export function usePublishedMap(initialFloorId?: string) {
  const [floorId, setFloorId] = useState(initialFloorId ?? "");
  const [data, setData] = useState<PublishedMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = floorId ? `?floorId=${encodeURIComponent(floorId)}` : "";
    readJson<PublishedMapResponse>(`/api/published-map${query}`)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setData(response);
        if (!floorId && response.published?.floor?.id) {
          setFloorId(response.published.floor.id);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load the published map.");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [floorId, reloadToken]);

  return {
    floorId,
    floors: data?.floors ?? [],
    published: data?.published ?? null,
    loading,
    error,
    setFloorId,
    refetch: () => setReloadToken((current) => current + 1),
  };
}

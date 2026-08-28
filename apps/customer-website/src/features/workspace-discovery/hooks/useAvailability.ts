"use client";

import { useEffect, useState } from "react";
import type { DateAvailabilityResult, TimeAvailabilityResult } from "@deskatlas/domain";
import { readJson } from "@/app/lib/api";

interface AvailabilityState {
  dates: DateAvailabilityResult | null;
  times: TimeAvailabilityResult | null;
  loadingDates: boolean;
  loadingTimes: boolean;
  dateError: string | null;
  timeError: string | null;
}

export function useAvailability(input: {
  workspaceInstanceId: string | null;
  startDate: string;
  endDate: string;
  date: string;
  durationMinutes: number;
}) {
  const [state, setState] = useState<AvailabilityState>({
    dates: null,
    times: null,
    loadingDates: false,
    loadingTimes: false,
    dateError: null,
    timeError: null,
  });

  useEffect(() => {
    if (!input.workspaceInstanceId || input.durationMinutes <= 0) {
      setState((current) => ({
        ...current,
        dates: null,
        loadingDates: false,
        dateError: null,
      }));
      return;
    }

    let cancelled = false;
    setState((current) => ({
      ...current,
      loadingDates: true,
      dateError: null,
    }));

    const params = new URLSearchParams({
      workspaceInstanceId: input.workspaceInstanceId,
      startDate: input.startDate,
      endDate: input.endDate,
      durationMinutes: String(input.durationMinutes),
    });

    readJson<DateAvailabilityResult>(`/api/availability?${params.toString()}`)
      .then((dates) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            dates,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            dates: null,
            dateError: error instanceof Error ? error.message : "Unable to load date availability.",
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loadingDates: false,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [input.durationMinutes, input.endDate, input.startDate, input.workspaceInstanceId]);

  useEffect(() => {
    if (!input.workspaceInstanceId || input.durationMinutes <= 0 || !input.date) {
      setState((current) => ({
        ...current,
        times: null,
        loadingTimes: false,
        timeError: null,
      }));
      return;
    }

    let cancelled = false;
    setState((current) => ({
      ...current,
      loadingTimes: true,
      timeError: null,
    }));

    const params = new URLSearchParams({
      workspaceInstanceId: input.workspaceInstanceId,
      date: input.date,
      durationMinutes: String(input.durationMinutes),
    });

    readJson<TimeAvailabilityResult>(`/api/availability?${params.toString()}`)
      .then((times) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            times,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            times: null,
            timeError: error instanceof Error ? error.message : "Unable to load time availability.",
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loadingTimes: false,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [input.date, input.durationMinutes, input.workspaceInstanceId]);

  return state;
}

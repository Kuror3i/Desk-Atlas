import type {
  DateAvailabilityResult,
  TimeAvailabilityResult,
} from '@deskatlas/domain';

export async function fetchDateAvailability(input: {
  workspaceInstanceId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
}): Promise<DateAvailabilityResult> {
  const params = new URLSearchParams({
    workspaceInstanceId: input.workspaceInstanceId,
    startDate: input.startDate,
    endDate: input.endDate,
    durationMinutes: String(input.durationMinutes),
  });
  const response = await fetch(`/api/availability?${params.toString()}`, {
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error ?? `Availability request failed with status ${response.status}`);
  }

  return body as DateAvailabilityResult;
}

export async function fetchTimeAvailability(input: {
  workspaceInstanceId: string;
  date: string;
  durationMinutes: number;
}): Promise<TimeAvailabilityResult> {
  const params = new URLSearchParams({
    workspaceInstanceId: input.workspaceInstanceId,
    date: input.date,
    durationMinutes: String(input.durationMinutes),
  });
  const response = await fetch(`/api/availability?${params.toString()}`, {
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error ?? `Availability request failed with status ${response.status}`);
  }

  return body as TimeAvailabilityResult;
}

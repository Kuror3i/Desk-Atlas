import type { Floor, PublishedFloorMap } from '@deskatlas/domain';

export async function fetchPublishedMap(floorId?: string): Promise<{
  floors: Floor[];
  published: PublishedFloorMap | null;
}> {
  const query = floorId ? `?floorId=${encodeURIComponent(floorId)}` : '';
  const response = await fetch(`/api/published-map${query}`, { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404) {
      return {
        floors: body.floors ?? [],
        published: null,
      };
    }
    throw new Error(body.error ?? `Published map request failed with status ${response.status}`);
  }

  return {
    floors: body.floors ?? [],
    published: body.published ?? null,
  };
}

export async function updateStaffInstanceOperationalStatus(
  instanceId: string,
  operationalStatus: string
): Promise<{
  instance: any;
  availability: any;
  affectedFutureReservations: any[];
  auditLogged: boolean;
}> {
  const response = await fetch(`/api/operations/workspaces/instances/${encodeURIComponent(instanceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationalStatus }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Failed to update workspace status (${response.status})`);
  }

  return body;
}


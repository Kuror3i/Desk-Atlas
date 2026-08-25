import type { FloorMap, MapElementInput } from '@deskatlas/domain';

export async function fetchAdminMapDraft(floorId?: string): Promise<FloorMap | null> {
  const query = floorId ? `?floorId=${encodeURIComponent(floorId)}` : '';
  const response = await fetch(`/api/admin/maps/draft${query}`, { cache: 'no-store' });
  const body = await parseJson(response);
  return body.draft ?? null;
}

export async function saveAdminMapDraft(input: {
  floorId?: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  elements: MapElementInput[];
}): Promise<FloorMap> {
  const response = await fetch('/api/admin/maps/draft', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await parseJson(response);
  return body.draft;
}

export async function publishAdminMapDraft(input: {
  floorId: string;
  actorUserId: string;
}): Promise<FloorMap> {
  const response = await fetch('/api/admin/maps/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await parseJson(response);
  return body.published;
}

async function parseJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Map API request failed with status ${response.status}`);
  }
  return body;
}

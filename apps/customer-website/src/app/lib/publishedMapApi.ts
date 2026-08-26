import type { Floor, PublishedFloorMap } from '@deskatlas/domain';

export async function fetchPublishedMap(floorId?: string): Promise<{
  floors: Floor[];
  published: PublishedFloorMap;
}> {
  const query = floorId ? `?floorId=${encodeURIComponent(floorId)}` : '';
  const response = await fetch(`/api/published-map${query}`, { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error ?? `Published map request failed with status ${response.status}`);
  }

  return {
    floors: body.floors ?? [],
    published: body.published,
  };
}

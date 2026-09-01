import type { PublishedFloorMap, PublishedMapAudience, PublishedMapRepository } from '../models/publishedMap';

export class PublishedMapNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishedMapNotFoundError';
  }
}

export function createPublishedMapService(repository: PublishedMapRepository) {
  return {
    async listPublishedFloors() {
      return repository.listPublishedFloors();
    },

    async loadPublishedFloorMap(
      floorId?: string,
      options?: { audience?: PublishedMapAudience }
    ): Promise<PublishedFloorMap> {
      const floors = await repository.listPublishedFloors();

      if (floors.length === 0) {
        throw new PublishedMapNotFoundError('No published floor map is available');
      }

      const selectedFloorId = floorId?.trim() || floors[0].id;
      const floorExists = floors.some((floor) => floor.id === selectedFloorId);

      if (!floorExists) {
        throw new PublishedMapNotFoundError(`Published floor map not found: ${selectedFloorId}`);
      }

      const published = await repository.loadPublishedFloorMap(selectedFloorId, options);
      if (!published) {
        throw new PublishedMapNotFoundError(`Published floor map not found: ${selectedFloorId}`);
      }

      return published;
    },
  };
}

import assert from 'node:assert/strict';

import {
  InMemoryPublishedMapRepository,
  PublishedMapNotFoundError,
  createPublishedMapService,
  type PublishedFloorMap,
  type PublishedWorkspaceSummary,
} from '../packages/domain/src/index';

function createWorkspace(overrides: Partial<PublishedWorkspaceSummary> = {}): PublishedWorkspaceSummary {
  return {
    workspaceInstanceId: overrides.workspaceInstanceId ?? 'workspace-a1',
    templateId: overrides.templateId ?? 'template-desk',
    floorId: overrides.floorId ?? 'floor-a',
    instanceCode: overrides.instanceCode ?? 'A1',
    displayName: overrides.displayName ?? 'Desk A1',
    templateName: overrides.templateName ?? 'Hot Desk',
    description: overrides.description ?? 'Window-side desk',
    photoPath: overrides.photoPath ?? 'templates/hot-desk.jpg',
    capacity: overrides.capacity ?? 1,
    rateAmount: overrides.rateAmount ?? 125,
    pricingUnit: overrides.pricingUnit ?? 'HOURLY',
    operationalStatus: overrides.operationalStatus ?? 'ACTIVE',
    isBookable: overrides.isBookable ?? true,
    blockingReason: overrides.blockingReason ?? null,
  };
}

function createPublishedFloorMap(
  floorId: string,
  floorName: string,
  displayOrder: number,
  overrides: Partial<PublishedFloorMap> = {}
): PublishedFloorMap {
  return {
    floor: {
      id: floorId,
      name: floorName,
      floorNumber: displayOrder,
      displayOrder,
      isActive: true,
      ...overrides.floor,
    },
    version: {
      id: `version-${floorId}`,
      versionNumber: displayOrder,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      publishedAt: '2026-08-25T09:00:00.000Z',
      ...overrides.version,
    },
    elements: overrides.elements ?? [
      {
        id: `structure-${floorId}`,
        elementRole: 'STRUCTURE',
        elementType: 'zone',
        x: 50,
        y: 50,
        width: 300,
        height: 180,
        rotation: 0,
        zIndex: 0,
        label: floorName,
        style: { color: 'rgba(0, 150, 137, 0.1)' },
        workspace: null,
      },
      {
        id: `workspace-${floorId}`,
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        rotation: 0,
        zIndex: 10,
        label: 'A1',
        style: { color: '#009689', shape: 'desk' },
        workspace: createWorkspace({ floorId, instanceCode: 'A1', workspaceInstanceId: `workspace-${floorId}` }),
      },
    ],
  };
}

async function main() {
  const repository = new InMemoryPublishedMapRepository();
  const service = createPublishedMapService(repository);

  repository.seedPublishedFloorMap(createPublishedFloorMap('floor-b', 'Second Floor', 2));
  repository.seedPublishedFloorMap(createPublishedFloorMap('floor-a', 'Main Floor', 1));
  repository.seedPublishedFloorMap(
    createPublishedFloorMap('floor-c', 'Closed Floor', 3, {
      floor: {
        id: 'floor-c',
        name: 'Closed Floor',
        floorNumber: 3,
        displayOrder: 3,
        isActive: false,
      },
    })
  );

  const floors = await service.listPublishedFloors();
  assert.deepEqual(
    floors.map((floor) => floor.id),
    ['floor-a', 'floor-b'],
    'only active published floors should be listed in display order'
  );

  const defaultPublishedMap = await service.loadPublishedFloorMap();
  assert.equal(defaultPublishedMap.floor.id, 'floor-a');
  assert.equal(defaultPublishedMap.version.publishedAt, '2026-08-25T09:00:00.000Z');
  assert.equal(defaultPublishedMap.elements[1]?.workspace?.displayName, 'Desk A1');
  assert.equal(defaultPublishedMap.elements[1]?.workspace?.isBookable, true);
  assert.equal(defaultPublishedMap.elements[1]?.workspace?.blockingReason, null);

  const secondFloorMap = await service.loadPublishedFloorMap('floor-b');
  assert.equal(secondFloorMap.floor.name, 'Second Floor');
  assert.equal(secondFloorMap.elements[0]?.workspace, null);

  await assert.rejects(
    () => service.loadPublishedFloorMap('floor-c'),
    (error: unknown) => {
      assert.ok(error instanceof PublishedMapNotFoundError);
      assert.equal(error.message, 'Published floor map not found: floor-c');
      return true;
    },
    'inactive floors should not be delivered through the published contract'
  );

  await assert.rejects(
    () => service.loadPublishedFloorMap('floor-missing'),
    (error: unknown) => {
      assert.ok(error instanceof PublishedMapNotFoundError);
      assert.equal(error.message, 'Published floor map not found: floor-missing');
      return true;
    },
    'unknown floors should return the published-map not-found contract'
  );

  const blockedRepository = new InMemoryPublishedMapRepository();
  blockedRepository.seedPublishedFloorMap(
    createPublishedFloorMap('floor-d', 'Maintenance Floor', 1, {
      elements: [
        {
          id: 'workspace-maintenance',
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          x: 120,
          y: 90,
          width: 80,
          height: 60,
          rotation: 0,
          zIndex: 10,
          label: 'D1',
          style: { color: '#64748b' },
          workspace: createWorkspace({
            floorId: 'floor-d',
            workspaceInstanceId: 'workspace-d1',
            instanceCode: 'D1',
            displayName: 'Desk D1',
            operationalStatus: 'BROKEN',
            isBookable: false,
            blockingReason: 'OPERATIONAL_STATUS_BLOCKED',
          }),
        },
      ],
    })
  );

  const blockedService = createPublishedMapService(blockedRepository);
  const blockedMap = await blockedService.loadPublishedFloorMap('floor-d');
  assert.equal(blockedMap.elements[0]?.workspace?.operationalStatus, 'BROKEN');
  assert.equal(blockedMap.elements[0]?.workspace?.isBookable, false);
  assert.equal(blockedMap.elements[0]?.workspace?.blockingReason, 'OPERATIONAL_STATUS_BLOCKED');

  const emptyRepository = new InMemoryPublishedMapRepository();
  const emptyService = createPublishedMapService(emptyRepository);
  await assert.rejects(
    () => emptyService.loadPublishedFloorMap(),
    (error: unknown) => {
      assert.ok(error instanceof PublishedMapNotFoundError);
      assert.equal(error.message, 'No published floor map is available');
      return true;
    },
    'empty published-map repositories should return a stable not-found error'
  );

  // Amenity published map verification
  const amenityMapRepo = new InMemoryPublishedMapRepository();
  amenityMapRepo.seedPublishedFloorMap(
    createPublishedFloorMap('floor-amenities', 'Amenities Floor', 1, {
      elements: [
        {
          id: 'amenity-restroom',
          elementRole: 'AMENITY',
          elementType: 'restroom',
          x: 100,
          y: 100,
          width: 100,
          height: 80,
          rotation: 0,
          zIndex: 1,
          label: 'Restroom',
          style: { color: '#E0F2FE', icon: 'restroom' },
          workspace: null,
        },
        {
          id: 'amenity-pantry',
          elementRole: 'AMENITY',
          elementType: 'pantry',
          x: 220,
          y: 100,
          width: 100,
          height: 80,
          rotation: 0,
          zIndex: 2,
          label: 'Pantry',
          style: { color: '#FEF3C7', icon: 'pantry' },
          workspace: null,
        },
        {
          id: 'amenity-exit',
          elementRole: 'AMENITY',
          elementType: 'emergency_exit',
          x: 340,
          y: 100,
          width: 100,
          height: 80,
          rotation: 0,
          zIndex: 3,
          label: 'Emergency Exit',
          style: { color: '#DCFCE7', icon: 'emergency_exit' },
          workspace: null,
        },
      ],
    })
  );

  const amenityMapService = createPublishedMapService(amenityMapRepo);
  const loadedAmenityMap = await amenityMapService.loadPublishedFloorMap('floor-amenities');
  assert.equal(loadedAmenityMap.elements.length, 3);
  assert.equal(loadedAmenityMap.elements[0].elementRole, 'AMENITY');
  assert.equal(loadedAmenityMap.elements[0].workspace, null);
  assert.equal(loadedAmenityMap.elements[0].style.color, '#E0F2FE');
  assert.equal(loadedAmenityMap.elements[1].elementRole, 'AMENITY');
  assert.equal(loadedAmenityMap.elements[1].workspace, null);
  assert.equal(loadedAmenityMap.elements[1].style.color, '#FEF3C7');
  assert.equal(loadedAmenityMap.elements[2].elementRole, 'AMENITY');
  assert.equal(loadedAmenityMap.elements[2].workspace, null);
  assert.equal(loadedAmenityMap.elements[2].style.color, '#DCFCE7');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

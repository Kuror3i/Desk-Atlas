import assert from 'node:assert/strict';
import {
  InMemoryWorkspaceRepository,
  InMemoryPublishedMapRepository,
  createWorkspaceService,
  createPublishedMapService,
  compareWorkspaceInstances,
  sortWorkspaceInstances,
} from '../packages/domain/src/index';

async function run() {
  // 1. Direct comparator unit tests
  const rawNames = [
    { displayName: 'Skypod 10', instanceCode: 'SP-10', id: 'inst-10' },
    { displayName: 'Skypod 2', instanceCode: 'SP-02', id: 'inst-2' },
    { displayName: 'Skypod 1', instanceCode: 'SP-01', id: 'inst-1' },
    { displayName: 'Skypod 20', instanceCode: 'SP-20', id: 'inst-20' },
    { displayName: 'Desk A', instanceCode: 'D-A', id: 'inst-a' },
    { displayName: 'Desk B', instanceCode: 'D-B', id: 'inst-b' },
  ];

  const sortedNames = sortWorkspaceInstances(rawNames);
  assert.deepEqual(
    sortedNames.map((x) => x.displayName),
    ['Desk A', 'Desk B', 'Skypod 1', 'Skypod 2', 'Skypod 10', 'Skypod 20'],
    'sortWorkspaceInstances should naturally order numeric suffixes'
  );

  // Deterministic secondary sort test
  const duplicates = [
    { displayName: 'Same Name', instanceCode: 'CODE-B', id: 'id-2' },
    { displayName: 'Same Name', instanceCode: 'CODE-A', id: 'id-1' },
  ];
  const sortedDuplicates = sortWorkspaceInstances(duplicates);
  assert.equal(sortedDuplicates[0].instanceCode, 'CODE-A');
  assert.equal(sortedDuplicates[1].instanceCode, 'CODE-B');

  // 2. InMemoryWorkspaceRepository and WorkspaceService integration
  const repository = new InMemoryWorkspaceRepository();
  const service = createWorkspaceService(repository);

  const template = await service.createTemplate({
    name: 'Skypod Tier',
    capacity: 1,
    rateAmount: 150,
  });

  const floorId = 'floor-default';

  // Create out of order: 10, 1, 20, 2, 5
  await service.createInstance({
    templateId: template.id,
    floorId,
    instanceCode: 'SP-10',
    displayName: 'Skypod 10',
  });
  await service.createInstance({
    templateId: template.id,
    floorId,
    instanceCode: 'SP-01',
    displayName: 'Skypod 1',
  });
  await service.createInstance({
    templateId: template.id,
    floorId,
    instanceCode: 'SP-20',
    displayName: 'Skypod 20',
  });
  await service.createInstance({
    templateId: template.id,
    floorId,
    instanceCode: 'SP-02',
    displayName: 'Skypod 2',
  });
  await service.createInstance({
    templateId: template.id,
    floorId,
    instanceCode: 'SP-05',
    displayName: 'Skypod 5',
  });

  // Verify listCatalog() returns natural order
  let catalog = await service.listCatalog();
  assert.deepEqual(
    catalog.instances.map((i) => i.displayName),
    ['Skypod 1', 'Skypod 2', 'Skypod 5', 'Skypod 10', 'Skypod 20'],
    'Catalog instances must be sorted in natural display name order'
  );

  // Verify listAdminSpaces() returns natural order
  let adminSpaces = await service.listAdminSpaces();
  assert.deepEqual(
    adminSpaces.map((s) => s.name),
    ['Skypod 1', 'Skypod 2', 'Skypod 5', 'Skypod 10', 'Skypod 20'],
    'Admin spaces must be sorted in natural display name order'
  );

  // 3. Rename an instance and verify natural sorting updates
  const instance20 = catalog.instances.find((i) => i.instanceCode === 'SP-20');
  assert.ok(instance20);
  await service.updateInstance(instance20.id, {
    displayName: 'Skypod 0',
  });

  catalog = await service.listCatalog();
  assert.deepEqual(
    catalog.instances.map((i) => i.displayName),
    ['Skypod 0', 'Skypod 1', 'Skypod 2', 'Skypod 5', 'Skypod 10'],
    'Catalog instances must update sort order after rename'
  );

  adminSpaces = await service.listAdminSpaces();
  assert.deepEqual(
    adminSpaces.map((s) => s.name),
    ['Skypod 0', 'Skypod 1', 'Skypod 2', 'Skypod 5', 'Skypod 10'],
    'Admin spaces must update sort order after rename'
  );

  // 4. Verify published map consumers remain sorted by map z-index and placement geometry
  const publishedMapRepo = new InMemoryPublishedMapRepository();
  const publishedMapService = createPublishedMapService(publishedMapRepo);

  publishedMapRepo.seedPublishedFloorMap({
    floor: {
      id: floorId,
      name: 'Main Floor',
      floorNumber: 1,
      displayOrder: 1,
      isActive: true,
    },
    version: {
      id: 'version-1',
      versionNumber: 1,
      canvasWidth: 1000,
      canvasHeight: 800,
      gridSize: 20,
      publishedAt: new Date().toISOString(),
    },
    elements: [
      {
        id: 'elem-2',
        elementRole: 'WORKSPACE',
        elementType: 'DESK',
        x: 200,
        y: 200,
        width: 60,
        height: 60,
        rotation: 0,
        zIndex: 2,
        label: 'Skypod 1',
        style: {},
        workspace: {
          workspaceInstanceId: 'inst-1',
          templateId: template.id,
          floorId,
          instanceCode: 'SP-01',
          displayName: 'Skypod 1',
          templateName: 'Skypod Tier',
          description: null,
          photoPath: null,
          capacity: 1,
          rateAmount: 150,
          pricingUnit: 'HOURLY',
          operationalStatus: 'ACTIVE',
          isBookable: true,
          blockingReason: null,
        },
      },
      {
        id: 'elem-1',
        elementRole: 'WORKSPACE',
        elementType: 'DESK',
        x: 100,
        y: 100,
        width: 60,
        height: 60,
        rotation: 0,
        zIndex: 1,
        label: 'Skypod 10',
        style: {},
        workspace: {
          workspaceInstanceId: 'inst-10',
          templateId: template.id,
          floorId,
          instanceCode: 'SP-10',
          displayName: 'Skypod 10',
          templateName: 'Skypod Tier',
          description: null,
          photoPath: null,
          capacity: 1,
          rateAmount: 150,
          pricingUnit: 'HOURLY',
          operationalStatus: 'ACTIVE',
          isBookable: true,
          blockingReason: null,
        },
      },
    ],
  });

  const publishedMap = await publishedMapService.loadPublishedFloorMap(floorId);
  assert.ok(publishedMap);
  // In published map, elements preserve map layout order (elem-2 was seeded first, elem-1 second) and are NOT re-sorted by workspace name
  assert.equal(publishedMap.elements[0].id, 'elem-2');
  assert.equal(publishedMap.elements[1].id, 'elem-1');
  assert.equal(publishedMap.elements[0].label, 'Skypod 1');
  assert.equal(publishedMap.elements[1].label, 'Skypod 10');

  console.log('MF-25 admin workspace natural name sort tests passed successfully');
}

run().catch((err) => {
  console.error('MF-25 test failed:', err);
  process.exit(1);
});

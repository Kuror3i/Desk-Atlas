import * as assert from 'assert';
import {
  InMemoryMapRepository,
  InMemoryPublishedMapRepository,
  createMapService,
  createPublishedMapService,
  PublishedMapNotFoundError,
  type Floor,
  type MapElementInput,
  type PublishedFloorMap,
  type PublishedWorkspaceSummary,
} from '../packages/domain/src/index';

async function runTests() {
  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  const floor1: Floor = {
    id: 'floor-ground',
    name: 'Ground Floor',
    floorNumber: 1,
    displayOrder: 1,
    isActive: true,
  };

  const floor2: Floor = {
    id: 'floor-second',
    name: 'Second Floor',
    floorNumber: 2,
    displayOrder: 2,
    isActive: true,
  };

  // 1. Truthful empty state when no map is published
  await runTest('truthful empty state when no map is published', async () => {
    const emptyRepo = new InMemoryPublishedMapRepository();
    const service = createPublishedMapService(emptyRepo);

    const floors = await service.listPublishedFloors();
    assert.strictEqual(floors.length, 0);

    await assert.rejects(
      () => service.loadPublishedFloorMap(),
      (err: any) => {
        assert.ok(err instanceof PublishedMapNotFoundError);
        assert.strictEqual(err.message, 'No published floor map is available');
        return true;
      }
    );
  });

  // 2. Staff workspace map loads published floor/version data and preserves MF-05, MF-06, MF-07 elements
  await runTest('staff workspace map loads published floor/version and preserves rectangle, wall, and amenity rules', async () => {
    const pubRepo = new InMemoryPublishedMapRepository();
    const service = createPublishedMapService(pubRepo);

    const publishedMapGround: PublishedFloorMap = {
      floor: floor1,
      version: {
        id: 'ver-ground-1',
        versionNumber: 1,
        canvasWidth: 1600,
        canvasHeight: 1000,
        gridSize: 20,
        publishedAt: '2026-08-29T12:00:00.000Z',
      },
      elements: [
        // Rectangle workspace (MF-05)
        {
          id: 'elem-desk-1',
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          x: 100,
          y: 100,
          width: 140,
          height: 70,
          rotation: 0,
          zIndex: 10,
          label: 'Desk A1',
          style: { color: '#009689' },
          workspace: {
            workspaceInstanceId: 'inst-desk-1',
            templateId: 'tmpl-desk',
            floorId: floor1.id,
            instanceCode: 'A1',
            displayName: 'Desk A1',
            templateName: 'Hot Desk',
            description: 'Window side hot desk',
            photoPath: null,
            capacity: 1,
            rateAmount: 150,
            pricingUnit: 'HOURLY',
            operationalStatus: 'ACTIVE',
            isBookable: true,
            blockingReason: null,
          },
        },
        // Maintenance workspace
        {
          id: 'elem-desk-2',
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          x: 260,
          y: 100,
          width: 140,
          height: 70,
          rotation: 0,
          zIndex: 10,
          label: 'Desk A2',
          style: { color: '#009689' },
          workspace: {
            workspaceInstanceId: 'inst-desk-2',
            templateId: 'tmpl-desk',
            floorId: floor1.id,
            instanceCode: 'A2',
            displayName: 'Desk A2',
            templateName: 'Hot Desk',
            description: 'Window side hot desk',
            photoPath: null,
            capacity: 1,
            rateAmount: 150,
            pricingUnit: 'HOURLY',
            operationalStatus: 'MAINTENANCE',
            isBookable: false,
            blockingReason: 'OPERATIONAL_STATUS_BLOCKED',
          },
        },
        // Wall structure (MF-06)
        {
          id: 'elem-wall-1',
          elementRole: 'STRUCTURE',
          elementType: 'wall',
          x: 50,
          y: 50,
          width: 600,
          height: 10,
          rotation: 0,
          zIndex: 1,
          label: null,
          style: { color: '#334155' },
          workspace: null,
        },
        // Restroom amenity with color and icon (MF-07)
        {
          id: 'elem-restroom',
          elementRole: 'AMENITY',
          elementType: 'restroom',
          x: 700,
          y: 50,
          width: 100,
          height: 80,
          rotation: 0,
          zIndex: 2,
          label: 'Restroom',
          style: { color: '#E0F2FE', icon: 'restroom' },
          workspace: null,
        },
        // Pantry amenity with color and icon (MF-07)
        {
          id: 'elem-pantry',
          elementRole: 'AMENITY',
          elementType: 'pantry',
          x: 820,
          y: 50,
          width: 120,
          height: 80,
          rotation: 0,
          zIndex: 2,
          label: 'Pantry',
          style: { color: '#FEF3C7', icon: 'pantry' },
          workspace: null,
        },
        // Emergency Exit amenity with color and icon (MF-07)
        {
          id: 'elem-exit',
          elementRole: 'AMENITY',
          elementType: 'emergency_exit',
          x: 960,
          y: 50,
          width: 80,
          height: 80,
          rotation: 0,
          zIndex: 2,
          label: 'Emergency Exit',
          style: { color: '#DCFCE7', icon: 'emergency_exit' },
          workspace: null,
        },
      ],
    };

    pubRepo.seedPublishedFloorMap(publishedMapGround);

    const loaded = await service.loadPublishedFloorMap(floor1.id);
    assert.strictEqual(loaded.floor.id, floor1.id);
    assert.strictEqual(loaded.version.versionNumber, 1);
    assert.strictEqual(loaded.elements.length, 6);

    // Verify rectangle workspace
    const desk1 = loaded.elements.find((e) => e.id === 'elem-desk-1')!;
    assert.ok(desk1);
    assert.strictEqual(desk1.elementRole, 'WORKSPACE');
    assert.strictEqual(desk1.width, 140);
    assert.strictEqual(desk1.height, 70);
    assert.ok(desk1.workspace);
    assert.strictEqual(desk1.workspace.instanceCode, 'A1');
    assert.strictEqual(desk1.workspace.operationalStatus, 'ACTIVE');
    assert.strictEqual(desk1.workspace.isBookable, true);

    // Verify maintenance workspace
    const desk2 = loaded.elements.find((e) => e.id === 'elem-desk-2')!;
    assert.ok(desk2);
    assert.strictEqual(desk2.workspace?.operationalStatus, 'MAINTENANCE');
    assert.strictEqual(desk2.workspace?.isBookable, false);

    // Verify wall structure
    const wall = loaded.elements.find((e) => e.id === 'elem-wall-1')!;
    assert.ok(wall);
    assert.strictEqual(wall.elementRole, 'STRUCTURE');
    assert.strictEqual(wall.height, 10);
    assert.strictEqual(wall.workspace, null);

    // Verify amenities
    const restroom = loaded.elements.find((e) => e.id === 'elem-restroom')!;
    assert.strictEqual(restroom.style.color, '#E0F2FE');
    assert.strictEqual(restroom.workspace, null);

    const pantry = loaded.elements.find((e) => e.id === 'elem-pantry')!;
    assert.strictEqual(pantry.style.color, '#FEF3C7');
    assert.strictEqual(pantry.workspace, null);

    const exit = loaded.elements.find((e) => e.id === 'elem-exit')!;
    assert.strictEqual(exit.style.color, '#DCFCE7');
    assert.strictEqual(exit.workspace, null);
  });

  // 3. Multi-floor selection and switching
  await runTest('multi-floor selection returns only published floors and allows floor navigation', async () => {
    const pubRepo = new InMemoryPublishedMapRepository();
    const service = createPublishedMapService(pubRepo);

    pubRepo.seedPublishedFloorMap({
      floor: floor1,
      version: {
        id: 'ver-1',
        versionNumber: 1,
        canvasWidth: 1600,
        canvasHeight: 1000,
        gridSize: 20,
        publishedAt: '2026-08-29T10:00:00.000Z',
      },
      elements: [],
    });

    pubRepo.seedPublishedFloorMap({
      floor: floor2,
      version: {
        id: 'ver-2',
        versionNumber: 2,
        canvasWidth: 1600,
        canvasHeight: 1000,
        gridSize: 20,
        publishedAt: '2026-08-29T11:00:00.000Z',
      },
      elements: [],
    });

    const floors = await service.listPublishedFloors();
    assert.strictEqual(floors.length, 2);
    assert.strictEqual(floors[0].id, floor1.id);
    assert.strictEqual(floors[1].id, floor2.id);

    const defaultMap = await service.loadPublishedFloorMap();
    assert.strictEqual(defaultMap.floor.id, floor1.id);

    const floor2Map = await service.loadPublishedFloorMap(floor2.id);
    assert.strictEqual(floor2Map.floor.id, floor2.id);
    assert.strictEqual(floor2Map.version.versionNumber, 2);
  });

  // 4. Draft isolation: Staff does not see unpublished draft modifications
  await runTest('staff published map remains isolated from unpublished draft edits', async () => {
    const instance1 = {
      id: 'inst-1',
      templateId: 'tmpl-1',
      floorId: floor1.id,
      instanceCode: 'D1',
      displayName: 'Desk 1',
      operationalStatus: 'ACTIVE' as const,
      template: {
        id: 'tmpl-1',
        name: 'Desk',
        description: null,
        photoPath: null,
        capacity: 1,
        rateAmount: 100,
        pricingUnit: 'HOURLY' as const,
        defaultShape: 'rectangle',
        defaultColor: '#009689',
        defaultStyle: {},
        isActive: true,
      },
      floor: floor1,
    };

    const mapRepo = new InMemoryMapRepository({
      floors: [floor1],
      workspaceInstances: [instance1],
    });
    const mapService = createMapService(mapRepo);

    // Initial draft and publish
    const initialElements: MapElementInput[] = [
      {
        id: 'elem-1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        workspaceInstanceId: 'inst-1',
        x: 100,
        y: 100,
        width: 100,
        height: 60,
        rotation: 0,
        zIndex: 1,
        label: 'Desk 1',
      },
    ];

    await mapService.saveDraft({
      floorId: floor1.id,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      elements: initialElements,
    });

    const publishResult = await mapService.publishDraft({ floorId: floor1.id });

    // Seed published repo with version 1
    const pubRepo = new InMemoryPublishedMapRepository();
    pubRepo.seedPublishedFloorMap({
      floor: floor1,
      version: {
        id: publishResult.published.version.id,
        versionNumber: 1,
        canvasWidth: 1600,
        canvasHeight: 1000,
        gridSize: 20,
        publishedAt: '2026-08-29T10:00:00.000Z',
      },
      elements: [
        {
          id: 'elem-1',
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          x: 100,
          y: 100,
          width: 100,
          height: 60,
          rotation: 0,
          zIndex: 1,
          label: 'Desk 1',
          style: {},
          workspace: {
            workspaceInstanceId: 'inst-1',
            templateId: 'tmpl-1',
            floorId: floor1.id,
            instanceCode: 'D1',
            displayName: 'Desk 1',
            templateName: 'Desk',
            description: null,
            photoPath: null,
            capacity: 1,
            rateAmount: 100,
            pricingUnit: 'HOURLY',
            operationalStatus: 'ACTIVE',
            isBookable: true,
            blockingReason: null,
          },
        },
      ],
    });

    const staffService = createPublishedMapService(pubRepo);

    // Admin makes a draft edit (adds a new unapproved element) but does NOT publish
    await mapService.saveDraft({
      floorId: floor1.id,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      elements: [
        ...initialElements,
        {
          id: 'elem-draft-only',
          elementRole: 'STRUCTURE',
          elementType: 'wall',
          x: 500,
          y: 500,
          width: 200,
          height: 10,
          rotation: 0,
          zIndex: 1,
          label: 'Draft Wall',
        },
      ],
    });

    // Staff loads published map - must still only see version 1 without draft wall
    const staffMap = await staffService.loadPublishedFloorMap(floor1.id);
    assert.strictEqual(staffMap.elements.length, 1);
    assert.strictEqual(staffMap.elements[0].id, 'elem-1');
    assert.ok(!staffMap.elements.some((e) => e.id === 'elem-draft-only'));
  });

  console.log('All MF-14 Staff Workspace Map Published View tests passed!');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

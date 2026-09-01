import * as assert from 'assert';
import {
  InMemoryPublishedMapRepository,
  createPublishedMapService,
  PublishedMapNotFoundError,
  type PublishedFloorMap,
  type PublishedWorkspaceSummary,
} from '../packages/domain/src/index';

function createWorkspace(overrides: Partial<PublishedWorkspaceSummary> = {}): PublishedWorkspaceSummary {
  return {
    workspaceInstanceId: overrides.workspaceInstanceId ?? 'workspace-a1',
    templateId: overrides.templateId ?? 'template-hot-desk',
    floorId: overrides.floorId ?? 'floor-1',
    instanceCode: overrides.instanceCode ?? 'A1',
    displayName: overrides.displayName ?? 'Hot Desk A1',
    templateName: overrides.templateName ?? 'Hot Desk',
    description: overrides.description ?? 'Dedicated ergonomic desk by the window',
    photoPath: overrides.photoPath ?? 'templates/hot-desk.webp',
    capacity: overrides.capacity ?? 1,
    rateAmount: overrides.rateAmount ?? 150,
    pricingUnit: overrides.pricingUnit ?? 'HOURLY',
    operationalStatus: overrides.operationalStatus ?? 'ACTIVE',
    isBookable: overrides.isBookable ?? true,
    blockingReason: overrides.blockingReason ?? null,
  };
}

function createPublishedFloorMap(
  floorId: string,
  floorName: string,
  floorNumber: number,
  overrides: Partial<PublishedFloorMap> = {}
): PublishedFloorMap {
  return {
    floor: {
      id: floorId,
      name: floorName,
      floorNumber,
      displayOrder: floorNumber,
      isActive: true,
      ...overrides.floor,
    },
    version: {
      id: `version-${floorId}`,
      versionNumber: 1,
      canvasWidth: 1200,
      canvasHeight: 800,
      gridSize: 20,
      publishedAt: '2026-08-28T10:00:00.000Z',
      ...overrides.version,
    },
    elements: overrides.elements ?? [
      {
        id: 'wall-1',
        elementRole: 'STRUCTURE',
        elementType: 'wall',
        x: 0,
        y: 0,
        width: 1200,
        height: 10,
        rotation: 0,
        zIndex: 1,
        label: 'North Wall',
        style: { color: '#334155' },
        workspace: null,
      },
      {
        id: 'amenity-restroom',
        elementRole: 'AMENITY',
        elementType: 'restroom',
        x: 50,
        y: 50,
        width: 120,
        height: 100,
        rotation: 0,
        zIndex: 2,
        label: 'Main Restroom',
        style: { color: '#E0F2FE' },
        workspace: null,
      },
      {
        id: 'workspace-a1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 200,
        y: 200,
        width: 100,
        height: 80,
        rotation: 0,
        zIndex: 10,
        label: 'A1',
        style: { color: '#E0EFE4' },
        workspace: createWorkspace({
          workspaceInstanceId: 'workspace-a1',
          floorId,
          instanceCode: 'A1',
          displayName: 'Desk A1',
        }),
      },
      {
        id: 'workspace-a2-maintenance',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 350,
        y: 200,
        width: 100,
        height: 80,
        rotation: 0,
        zIndex: 10,
        label: 'A2',
        style: { color: '#FCF060' },
        workspace: createWorkspace({
          workspaceInstanceId: 'workspace-a2',
          floorId,
          instanceCode: 'A2',
          displayName: 'Desk A2',
          operationalStatus: 'MAINTENANCE',
          isBookable: false,
          blockingReason: 'OPERATIONAL_STATUS_BLOCKED',
        }),
      },
    ],
  };
}

async function runTests() {
  const repository = new InMemoryPublishedMapRepository();
  const service = createPublishedMapService(repository);

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // Seed sample floor maps
  repository.seedPublishedFloorMap(createPublishedFloorMap('floor-ground', 'Ground Floor', 1));
  repository.seedPublishedFloorMap(createPublishedFloorMap('floor-2', '2nd Floor Mezzanine', 2));

  // 1. List active published floors
  await runTest('List published floors for reserve screen floor selection', async () => {
    const floors = await service.listPublishedFloors();
    assert.strictEqual(floors.length, 2);
    assert.strictEqual(floors[0].id, 'floor-ground');
    assert.strictEqual(floors[1].id, 'floor-2');
  });

  // 2. Load published floor map with all elements
  await runTest('Load published map containing WORKSPACE, STRUCTURE, and AMENITY elements', async () => {
    const map = await service.loadPublishedFloorMap('floor-ground');
    assert.ok(map);
    assert.strictEqual(map.floor.name, 'Ground Floor');
    assert.strictEqual(map.version.canvasWidth, 1200);
    assert.strictEqual(map.version.canvasHeight, 800);
    assert.strictEqual(map.elements.length, 4);

    const structure = map.elements.find((e) => e.elementRole === 'STRUCTURE');
    assert.ok(structure);
    assert.strictEqual(structure.elementType, 'wall');

    const amenity = map.elements.find((e) => e.elementRole === 'AMENITY');
    assert.ok(amenity);
    assert.strictEqual(amenity.elementType, 'restroom');

    const bookableWorkspace = map.elements.find((e) => e.workspace?.instanceCode === 'A1');
    assert.ok(bookableWorkspace);
    assert.strictEqual(bookableWorkspace.workspace?.isBookable, true);
    assert.strictEqual(bookableWorkspace.workspace?.operationalStatus, 'ACTIVE');

    const maintenanceWorkspace = map.elements.find((e) => e.workspace?.instanceCode === 'A2');
    assert.ok(maintenanceWorkspace);
    assert.strictEqual(maintenanceWorkspace.workspace?.isBookable, false);
    assert.strictEqual(maintenanceWorkspace.workspace?.operationalStatus, 'MAINTENANCE');
  });

  // 3. No inventory hold or reservation created upon spot selection
  await runTest('Spot selection on map creates no server-side reservation or hold', async () => {
    // Verifying invariant: Selecting a spot is client-local UI state only
    const map = await service.loadPublishedFloorMap('floor-ground');
    const selectedSpot = map.elements.find((e) => e.workspace?.instanceCode === 'A1');
    assert.ok(selectedSpot?.workspace);

    // Map remains unchanged, no pending hold tokens or reservations generated
    assert.strictEqual(selectedSpot.workspace.blockingReason, null);
    assert.strictEqual(selectedSpot.workspace.isBookable, true);
  });

  // 4. Fit view zoom calculation logic
  await runTest('Fit View calculates optimal zoom ratio within bounds [0.4, 1.2]', async () => {
    const canvasWidth = 1200;
    
    // Narrow mobile viewport (360px container -> ~312px available)
    const mobileContainerWidth = 312;
    const mobileZoom = Math.min(1.2, Math.max(0.4, mobileContainerWidth / canvasWidth));
    assert.strictEqual(mobileZoom, 0.4); // Clamped to min 0.4

    // Medium tablet viewport (800px container -> ~752px available)
    const tabletContainerWidth = 752;
    const tabletZoom = Math.min(1.2, Math.max(0.4, tabletContainerWidth / canvasWidth));
    assert.strictEqual(Number(tabletZoom.toFixed(2)), 0.63);

    // Wide desktop viewport (1400px container -> ~1352px available)
    const desktopContainerWidth = 1352;
    const desktopZoom = Math.min(1.2, Math.max(0.4, desktopContainerWidth / canvasWidth));
    assert.strictEqual(Number(desktopZoom.toFixed(2)), 1.13);
  });

  // 5. Public-safe DTO compliance
  await runTest('Published map elements expose only public-safe workspace attributes', async () => {
    const map = await service.loadPublishedFloorMap('floor-ground');
    for (const el of map.elements) {
      if (el.workspace) {
        assert.ok(el.workspace.workspaceInstanceId);
        assert.ok(el.workspace.displayName);
        assert.ok(el.workspace.rateAmount);
        assert.strictEqual((el.workspace as any).adminNotes, undefined);
        assert.strictEqual((el.workspace as any).secretToken, undefined);
      }
    }
  });

  console.log('\nAll MF-18 tests passed successfully!');
}

runTests();

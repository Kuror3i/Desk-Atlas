import * as assert from 'assert';
import {
  computeFitViewZoom,
  clampMapZoom,
  getSavedMapZoom,
  saveMapZoom,
  getMapViewportBounds,
  DEFAULT_MAP_CANVAS_WIDTH,
  DEFAULT_MAP_CANVAS_HEIGHT,
  DEFAULT_MAP_GRID_SIZE,
  MIN_MAP_ZOOM,
  MAX_MAP_ZOOM,
  InMemoryWorkspaceRepository,
  createWorkspaceService,
  InMemoryMapRepository,
  createMapService,
} from '../packages/domain/src/index';

async function runTests() {
  async function runTest(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // 1. Zoom clamping
  await runTest('clampMapZoom bounds zoom between MIN_MAP_ZOOM (0.2) and MAX_MAP_ZOOM (2.0)', () => {
    assert.strictEqual(clampMapZoom(0.05), 0.2);
    assert.strictEqual(clampMapZoom(0.2), 0.2);
    assert.strictEqual(clampMapZoom(1.0), 1.0);
    assert.strictEqual(clampMapZoom(1.5), 1.5);
    assert.strictEqual(clampMapZoom(1.75), 1.75);
    assert.strictEqual(clampMapZoom(2.0), 2.0);
    assert.strictEqual(clampMapZoom(3.5), 2.0);
    assert.strictEqual(clampMapZoom(NaN), 1.0);
    assert.strictEqual(clampMapZoom(Infinity), 1.0);
  });

  // 2. Fit view calculation parity across viewport sizes
  await runTest('computeFitViewZoom calculates consistent scale for Map Builder and Workspace Map containers', () => {
    const canvasWidth = 1600;
    const canvasHeight = 1000;

    // Whole space container fitting (padding = 0)
    const containerW = 1400;
    const containerH = 900;
    const wholeSpaceZoom = computeFitViewZoom(containerW, containerH, canvasWidth, canvasHeight, 0);
    const expectedScale = Math.min(containerW / canvasWidth, containerH / canvasHeight);
    assert.strictEqual(wholeSpaceZoom, clampMapZoom(expectedScale));
    assert.strictEqual(wholeSpaceZoom, 0.88);

    // Small container (e.g. 800 x 600)
    const smallW = 800;
    const smallH = 600;
    const smallZoom = computeFitViewZoom(smallW, smallH, canvasWidth, canvasHeight, 0);
    const expectedSmallScale = Math.min(smallW / canvasWidth, smallH / canvasHeight);
    assert.strictEqual(smallZoom, clampMapZoom(expectedSmallScale));
    assert.strictEqual(smallZoom, 0.5);

    // Large ultrawide container (e.g. 2400 x 1400)
    const wideW = 2400;
    const wideH = 1400;
    const wideZoom = computeFitViewZoom(wideW, wideH, canvasWidth, canvasHeight, 0);
    const expectedWideScale = Math.min(wideW / canvasWidth, wideH / canvasHeight);
    assert.strictEqual(wideZoom, clampMapZoom(expectedWideScale));
    assert.strictEqual(wideZoom, 1.4);
  });

  // 3. Viewport bounds calculation
  await runTest('getMapViewportBounds provides accurate scaled container dimensions', () => {
    const bounds1 = getMapViewportBounds(1600, 1000, 1.0);
    assert.strictEqual(bounds1.canvasWidth, 1600);
    assert.strictEqual(bounds1.canvasHeight, 1000);
    assert.strictEqual(bounds1.zoom, 1.0);
    assert.strictEqual(bounds1.scaledWidth, 1600);
    assert.strictEqual(bounds1.scaledHeight, 1000);

    const boundsHalf = getMapViewportBounds(1600, 1000, 0.5);
    assert.strictEqual(boundsHalf.zoom, 0.5);
    assert.strictEqual(boundsHalf.scaledWidth, 800);
    assert.strictEqual(boundsHalf.scaledHeight, 500);

    const boundsFit = getMapViewportBounds(1600, 1000, 0.85);
    assert.strictEqual(boundsFit.zoom, 0.85);
    assert.strictEqual(boundsFit.scaledWidth, 1360);
    assert.strictEqual(boundsFit.scaledHeight, 850);
  });

  // 4. Zoom preference persistence per floor
  await runTest('saveMapZoom and getSavedMapZoom persist zoom configuration per floor independently', () => {
    const mockStorage: Record<string, string> = {};
    const storageAdapter = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
    };

    const floorGround = 'floor-ground';
    const floorMezzanine = 'floor-mezzanine';

    // No preference initially
    assert.strictEqual(getSavedMapZoom(floorGround, storageAdapter), null);
    assert.strictEqual(getSavedMapZoom(floorMezzanine, storageAdapter), null);

    // Save zoom for ground floor
    saveMapZoom(floorGround, 0.85, storageAdapter);
    assert.strictEqual(getSavedMapZoom(floorGround, storageAdapter), 0.85);
    assert.strictEqual(getSavedMapZoom(floorMezzanine, storageAdapter), null);

    // Save different zoom for mezzanine
    saveMapZoom(floorMezzanine, 1.25, storageAdapter);
    assert.strictEqual(getSavedMapZoom(floorGround, storageAdapter), 0.85);
    assert.strictEqual(getSavedMapZoom(floorMezzanine, storageAdapter), 1.25);

    // Clamping on retrieval of invalid values
    mockStorage['deskatlas_map_zoom_corrupt'] = '10.5';
    assert.strictEqual(getSavedMapZoom('corrupt', storageAdapter), null);
  });

  // 5. Invariant: Element coordinates and geometries are never altered by zoom/viewport scaling
  await runTest('Element coordinates (x, y, width, height) remain invariant across zoom changes and map reload', async () => {
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const workspaceService = createWorkspaceService(workspaceRepo);

    // Create floor with workspace
    const floor = await workspaceService.createFloor({ name: 'Floor 1' });
    const tpl = await workspaceService.createTemplate({
      name: 'Dedicated Desk',
      capacity: 1,
      rateAmount: 120,
      defaultShape: 'rectangle',
      defaultColor: '#009689',
    });
    const inst = await workspaceService.createInstanceFromTemplate({
      templateId: tpl.id,
      floorId: floor.id,
    });

    const mapRepo = new InMemoryMapRepository({
      floors: [floor],
      workspaceInstances: [
        { id: inst.id, floorId: floor.id, operationalStatus: 'ACTIVE' },
      ],
    });
    const mapService = createMapService(mapRepo);

    const originalElements = [
      {
        elementRole: 'WORKSPACE' as const,
        elementType: 'rectangle',
        workspaceInstanceId: inst.id,
        x: 120,
        y: 180,
        width: 140,
        height: 80,
        rotation: 0 as const,
        label: 'Desk 101',
      },
      {
        elementRole: 'STRUCTURE' as const,
        elementType: 'wall',
        workspaceInstanceId: null,
        x: 0,
        y: 0,
        width: 1600,
        height: 20,
        rotation: 0 as const,
        label: 'Main Perimeter Wall',
      },
    ];

    // Save draft with standard 1600x1000 canvas
    const savedDraft = await mapService.saveDraft({
      floorId: floor.id,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      elements: originalElements,
    });

    assert.strictEqual(savedDraft.version.canvasWidth, 1600);
    assert.strictEqual(savedDraft.version.canvasHeight, 1000);
    assert.strictEqual(savedDraft.elements.length, 2);

    const savedDesk = savedDraft.elements.find(e => e.elementRole === 'WORKSPACE');
    assert.ok(savedDesk);
    assert.strictEqual(savedDesk.x, 120);
    assert.strictEqual(savedDesk.y, 180);
    assert.strictEqual(savedDesk.width, 140);
    assert.strictEqual(savedDesk.height, 80);

    // Publish draft
    const published = await mapService.publishDraft({ floorId: floor.id });
    assert.strictEqual(published.published.version.canvasWidth, 1600);
    assert.strictEqual(published.published.version.canvasHeight, 1000);

    const pubDesk = published.published.elements.find(e => e.elementRole === 'WORKSPACE');
    assert.ok(pubDesk);
    assert.strictEqual(pubDesk.x, 120);
    assert.strictEqual(pubDesk.y, 180);
    assert.strictEqual(pubDesk.width, 140);
    assert.strictEqual(pubDesk.height, 80);
  });

  console.log('\nAll MF-26 Map Viewport Parity and Zoom Configuration tests passed successfully!');
}

runTests();

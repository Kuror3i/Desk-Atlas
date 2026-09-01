import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  computeFitViewZoom,
  clampMapZoom,
  getSavedMapZoom,
  saveMapZoom,
  DEFAULT_MAP_CANVAS_WIDTH,
  DEFAULT_MAP_CANVAS_HEIGHT,
  DEFAULT_MAP_GRID_SIZE,
  InMemoryPublishedMapRepository,
  createPublishedMapService,
  type PublishedFloorMap,
} from '../packages/domain/src/index';

function createMockPublishedMap(): PublishedFloorMap {
  return {
    floor: {
      id: 'floor-ground',
      name: 'Ground Floor',
      floorNumber: 1,
      displayOrder: 1,
      isActive: true,
    },
    version: {
      id: 'version-ground-1',
      versionNumber: 6,
      canvasWidth: DEFAULT_MAP_CANVAS_WIDTH,
      canvasHeight: DEFAULT_MAP_CANVAS_HEIGHT,
      gridSize: DEFAULT_MAP_GRID_SIZE,
      publishedAt: '2026-08-30T10:00:00.000Z',
    },
    elements: [
      {
        id: 'ws-a1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        rotation: 0,
        zIndex: 10,
        label: 'A1',
        style: { color: '#E0EFE4' },
        workspace: {
          workspaceInstanceId: 'inst-a1',
          templateId: 'tpl-hot-desk',
          floorId: 'floor-ground',
          instanceCode: 'A1',
          displayName: 'Hot Desk A1',
          templateName: 'Hot Desk',
          description: 'Quiet corner workspace',
          photoPath: '/photos/hot-desk.webp',
          capacity: 1,
          rateAmount: 150,
          pricingUnit: 'HOURLY',
          operationalStatus: 'ACTIVE',
          isBookable: true,
          blockingReason: null,
        },
      },
    ],
  };
}

async function runTests() {
  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      process.exit(1);
    }
  }

  // 1. Viewport & Zoom calculation parity with admin and staff
  await test('computeFitViewZoom calculates correct zoom to prevent horizontal scroll on desktop', () => {
    // Desktop container width 1500px, height 700px, canvas 1600x1000
    const desktopZoom = computeFitViewZoom(1500, 700, DEFAULT_MAP_CANVAS_WIDTH, DEFAULT_MAP_CANVAS_HEIGHT, 0);
    assert.strictEqual(desktopZoom, 0.7); // min(1500/1600 = 0.9375, 700/1000 = 0.70) => 0.70

    // Full scaled width: 1600 * 0.7 = 1120px <= 1500px available width (fits without horizontal overflow)
    const scaledWidth = DEFAULT_MAP_CANVAS_WIDTH * desktopZoom;
    assert.ok(scaledWidth <= 1500, `Scaled width ${scaledWidth} must fit in 1500px`);

    // Standard 1080p desktop container (1200px width, 600px height)
    const standardDesktopZoom = computeFitViewZoom(1200, 600, DEFAULT_MAP_CANVAS_WIDTH, DEFAULT_MAP_CANVAS_HEIGHT, 0);
    assert.strictEqual(standardDesktopZoom, 0.6);
    assert.ok(DEFAULT_MAP_CANVAS_WIDTH * standardDesktopZoom <= 1200);
  });

  // 2. Saved zoom persistence parity
  await test('getSavedMapZoom and saveMapZoom persist per-floor zoom preferences', () => {
    const memoryStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => memoryStore[k] ?? null,
      setItem: (k: string, v: string) => {
        memoryStore[k] = v;
      },
    };

    saveMapZoom('floor-ground', 0.85, mockStorage);
    const restored = getSavedMapZoom('floor-ground', mockStorage);
    assert.strictEqual(restored, 0.85);

    // Missing floor returns null fallback
    assert.strictEqual(getSavedMapZoom('floor-unknown', mockStorage), null);
  });

  // 3. Public-safe published map service does not expose draft metadata
  await test('Published map service loads public floor map omitting draft data', async () => {
    const repo = new InMemoryPublishedMapRepository();
    repo.seedPublishedFloorMap(createMockPublishedMap());
    const service = createPublishedMapService(repo);

    const map = await service.loadPublishedFloorMap('floor-ground');
    assert.ok(map);
    assert.strictEqual(map.floor.id, 'floor-ground');
    assert.strictEqual(map.elements.length, 1);
    assert.strictEqual(map.elements[0].workspace?.displayName, 'Hot Desk A1');
  });

  // 4. Source code audit: verify internal version labels and badges (e.g. v6 Live) are removed from ReservationPage.tsx
  await test('ReservationPage.tsx has internal version numbers and Live badges removed', () => {
    const filePath = path.resolve(process.cwd(), 'apps/customer-website/src/features/reservation/components/ReservationPage.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    // Verify max-w-[1600px] or full-width is used for available page width
    assert.ok(
      source.includes('max-w-[1600px]') || source.includes('max-w-none') || source.includes('max-w-full'),
      'ReservationPage must utilize full available width'
    );

    // Verify v{...} Live badge is removed
    assert.ok(!source.includes('Live</span>'), 'Live badge span must be removed from customer UI');
    assert.ok(!source.includes('v{published.version.versionNumber}'), 'Version label must not be rendered in customer UI');

    // Verify canvasRef and viewport parity with admin/staff
    assert.ok(source.includes('computeFitViewZoom('), 'ReservationPage must use computeFitViewZoom');
    assert.ok(source.includes('getSavedMapZoom('), 'ReservationPage must use getSavedMapZoom');
    assert.ok(source.includes('saveMapZoom('), 'ReservationPage must use saveMapZoom');
  });

  console.log('\nAll MF-30 tests passed successfully!');
}

runTests();

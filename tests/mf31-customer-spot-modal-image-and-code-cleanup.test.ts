import assert from 'node:assert';
import type { PublishedFloorMap } from '../packages/domain/src/models/publishedMap';
import {
  mapPublishedFloorToWorkspaceCards,
  getWorkspacePhotoObjectPosition,
} from '../apps/customer-website/src/features/workspace-discovery/utils/adapters';

function buildMockPublishedMap(): PublishedFloorMap {
  return {
    floor: {
      id: 'floor-1',
      name: 'Main Floor',
      floorNumber: 1,
      displayOrder: 1,
      isActive: true,
    },
    version: {
      id: 'version-1',
      versionNumber: 1,
      canvasWidth: 1200,
      canvasHeight: 800,
      gridSize: 20,
      publishedAt: '2026-08-30T00:00:00.000Z',
    },
    elements: [
      {
        id: 'el-focus-1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 100,
        y: 120,
        width: 80,
        height: 60,
        rotation: 0,
        zIndex: 10,
        label: 'Focus Pod 1',
        style: { color: '#E0EFE4' },
        workspace: {
          workspaceInstanceId: 'inst-focus-1',
          templateId: 'tpl-focus',
          floorId: 'floor-1',
          instanceCode: 'FOC-5510',
          displayName: 'Focus Pod 1',
          templateName: 'Focus Pod',
          description: 'Quiet individual workspace with premium ergonomic seating.',
          photoPath: 'https://storage.deskatlas.test/workspace-images/templates/focus-pod.webp',
          photoPosition: { x: 30, y: 75 },
          capacity: 1,
          rateAmount: 120,
          pricingUnit: 'HOURLY',
          operationalStatus: 'ACTIVE',
          isBookable: true,
          blockingReason: null,
          tags: ['Solo', 'Quiet'],
        },
      },
      {
        id: 'el-suite-1',
        elementRole: 'WORKSPACE',
        elementType: 'meeting-room',
        x: 300,
        y: 120,
        width: 200,
        height: 160,
        rotation: 0,
        zIndex: 10,
        label: 'Executive Suite',
        style: { color: '#E0EFE4' },
        workspace: {
          workspaceInstanceId: 'inst-suite-1',
          templateId: 'tpl-suite',
          floorId: 'floor-1',
          instanceCode: 'STE-9901',
          displayName: 'Executive Suite A',
          templateName: 'Executive Suite',
          description: null,
          photoPath: null,
          photoPosition: undefined,
          capacity: 6,
          rateAmount: 800,
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
  console.log('Running MF-31 Customer Spot Modal Image And Code Cleanup Tests...\n');

  // Test 1: Adapter forwards photoPosition from PublishedWorkspaceSummary to WorkspaceMapViewModel
  {
    const map = buildMockPublishedMap();
    const cards = mapPublishedFloorToWorkspaceCards(map);

    const focusCard = cards.find((c) => c.workspaceInstanceId === 'inst-focus-1');
    assert.ok(focusCard, 'Focus card must exist');
    assert.deepStrictEqual(
      focusCard.photoPosition,
      { x: 30, y: 75 },
      'Adapter must preserve photoPosition coordinates'
    );

    const suiteCard = cards.find((c) => c.workspaceInstanceId === 'inst-suite-1');
    assert.ok(suiteCard, 'Suite card must exist');
    assert.strictEqual(
      suiteCard.photoPosition,
      undefined,
      'photoPosition is undefined when not configured'
    );
    console.log('[PASS] Adapter properly forwards template photoPosition coordinates');
  }

  // Test 2: getWorkspacePhotoObjectPosition helper resolves custom and fallback positions
  {
    assert.strictEqual(
      getWorkspacePhotoObjectPosition({ x: 30, y: 75 }),
      '30% 75%',
      'Custom coordinates formatted into objectPosition CSS value'
    );

    assert.strictEqual(
      getWorkspacePhotoObjectPosition({ x: 0, y: 100 }),
      '0% 100%',
      'Boundary coordinates formatted correctly'
    );

    assert.strictEqual(
      getWorkspacePhotoObjectPosition(undefined),
      '50% 50%',
      'Undefined photoPosition defaults to centered 50% 50%'
    );

    assert.strictEqual(
      getWorkspacePhotoObjectPosition({} as any),
      '50% 50%',
      'Empty object defaults to centered 50% 50%'
    );
    console.log('[PASS] getWorkspacePhotoObjectPosition produces correct CSS objectPosition strings');
  }

  // Test 3: Spot modal data contract ensures customer-safe presentation
  {
    const map = buildMockPublishedMap();
    const cards = mapPublishedFloorToWorkspaceCards(map);
    const focusCard = cards.find((c) => c.workspaceInstanceId === 'inst-focus-1')!;

    // Customer-safe attributes
    assert.strictEqual(focusCard.displayName, 'Focus Pod 1');
    assert.strictEqual(focusCard.templateName, 'Focus Pod');
    assert.strictEqual(focusCard.floorName, 'Main Floor');
    assert.strictEqual(focusCard.rateAmount, 120);
    assert.strictEqual(focusCard.capacity, 1);
    assert.deepStrictEqual(focusCard.tags, ['Solo', 'Quiet']);
    assert.strictEqual(focusCard.status, 'available');
    assert.strictEqual(focusCard.statusLabel, 'Available');

    // Internal code remains present in model for backend routing & operational parity
    assert.strictEqual(focusCard.instanceCode, 'FOC-5510');
    console.log('[PASS] Customer view model preserves customer-safe data while keeping instanceCode available for backend/operational use');
  }

  console.log('\nAll MF-31 tests passed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

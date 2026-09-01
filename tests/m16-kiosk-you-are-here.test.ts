import assert from 'node:assert/strict';
import {
  InMemoryMapRepository,
  InMemoryPublishedMapRepository,
  InMemoryWorkspaceRepository,
  MapValidationError,
  createMapService,
  createPublishedMapService,
  createWorkspaceService,
  type Floor,
  type MapElementInput,
  type PublishedFloorMap,
} from '../packages/domain/src/index';

const floorA: Floor = {
  id: 'floor-default',
  name: 'Ground Floor',
  floorNumber: 1,
  displayOrder: 0,
  isActive: true,
};

const floorB: Floor = {
  id: 'floor-b',
  name: 'Second Floor',
  floorNumber: 2,
  displayOrder: 1,
  isActive: true,
};

async function run() {
  console.log('--- Running M16: Kiosk "You Are Here" Marker Tests ---');

  const workspaceRepository = new InMemoryWorkspaceRepository();
  const workspaceService = createWorkspaceService(workspaceRepository);

  const template = await workspaceService.createTemplate({
    name: 'Dedicated Desk',
    capacity: 1,
    rateAmount: 150,
    defaultShape: 'desk',
    defaultColor: '#009689',
  });

  const desk1 = await workspaceService.createInstance({
    templateId: template.id,
    floorId: floorA.id,
    instanceCode: 'A1',
    displayName: 'Desk A1',
  });

  const mapRepository = new InMemoryMapRepository({
    floors: [floorA, floorB],
    workspaceInstances: [{ id: desk1.id, floorId: floorA.id, operationalStatus: 'ACTIVE' }],
  });
  const mapService = createMapService(mapRepository);

  // 1. Happy path: Admin can draft a floor map with a KIOSK_YOU_ARE_HERE marker
  const validDraftElements: MapElementInput[] = [
    {
      elementRole: 'WORKSPACE',
      elementType: 'desk',
      workspaceInstanceId: desk1.id,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 1,
      label: 'Desk A1',
      properties: { color: '#009689' },
      isLocked: false,
    },
    {
      elementRole: 'INFORMATION',
      elementType: 'KIOSK_YOU_ARE_HERE',
      workspaceInstanceId: null,
      x: 20,
      y: 20,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 2,
      label: 'You Are Here',
      properties: { color: '#DC2626', markerType: 'KIOSK_YOU_ARE_HERE' },
      isLocked: false,
    },
  ];

  const draft = await mapService.saveDraft({
    floorId: floorA.id,
    canvasWidth: 1200,
    canvasHeight: 800,
    gridSize: 20,
    elements: validDraftElements,
    actorUserId: 'admin-1',
  });

  assert.equal(draft.elements.length, 2, 'Draft should contain 2 elements');
  const markerInDraft = draft.elements.find(
    (e) => e.elementType === 'KIOSK_YOU_ARE_HERE'
  );
  assert.ok(markerInDraft, 'Draft should contain KIOSK_YOU_ARE_HERE marker');
  assert.equal(markerInDraft.elementRole, 'INFORMATION');
  assert.equal(markerInDraft.workspaceInstanceId, null);
  assert.equal(markerInDraft.label, 'You Are Here');
  console.log('✓ Case 1 passed: Successfully drafted map with Kiosk marker');

  // 2. Draft validation: Reject multiple kiosk markers on the same floor
  const multipleMarkers: MapElementInput[] = [
    {
      elementRole: 'INFORMATION',
      elementType: 'KIOSK_YOU_ARE_HERE',
      workspaceInstanceId: null,
      x: 20,
      y: 20,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 1,
      label: 'Marker 1',
      properties: { color: '#DC2626' },
      isLocked: false,
    },
    {
      elementRole: 'INFORMATION',
      elementType: 'KIOSK_YOU_ARE_HERE',
      workspaceInstanceId: null,
      x: 200,
      y: 200,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 2,
      label: 'Marker 2',
      properties: { color: '#DC2626' },
      isLocked: false,
    },
  ];

  await assert.rejects(
    async () => {
      await mapService.saveDraft({
        floorId: floorA.id,
        canvasWidth: 1200,
        canvasHeight: 800,
        gridSize: 20,
        elements: multipleMarkers,
        actorUserId: 'admin-1',
      });
    },
    (err: Error) => {
      assert.ok(err instanceof MapValidationError);
      assert.match(err.message, /at most one Kiosk You-Are-Here marker/i);
      return true;
    },
    'Should reject multiple Kiosk markers per floor map'
  );
  console.log('✓ Case 2 passed: Multiple kiosk markers correctly rejected with MapValidationError');

  // 3. Non-bookable validation: Reject kiosk marker linked to a workspace instance
  const invalidBookableMarker: MapElementInput[] = [
    {
      elementRole: 'INFORMATION',
      elementType: 'KIOSK_YOU_ARE_HERE',
      workspaceInstanceId: desk1.id,
      x: 20,
      y: 20,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 1,
      label: 'Marker on Desk',
      properties: { color: '#DC2626' },
      isLocked: false,
    },
  ];

  await assert.rejects(
    async () => {
      await mapService.saveDraft({
        floorId: floorA.id,
        canvasWidth: 1200,
        canvasHeight: 800,
        gridSize: 20,
        elements: invalidBookableMarker,
        actorUserId: 'admin-1',
      });
    },
    (err: Error) => {
      assert.ok(err instanceof MapValidationError);
      assert.match(err.message, /cannot link to a workspace instance/i);
      return true;
    },
    'Should reject kiosk marker linked to workspaceInstanceId'
  );
  console.log('✓ Case 3 passed: Linked workspace instance rejected for kiosk marker');

  // 4. Update / Repositioning: Updating the kiosk marker's position succeeds
  const updatedElements: MapElementInput[] = [
    {
      elementRole: 'WORKSPACE',
      elementType: 'desk',
      workspaceInstanceId: desk1.id,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 1,
      label: 'Desk A1',
      properties: { color: '#009689' },
      isLocked: false,
    },
    {
      elementRole: 'INFORMATION',
      elementType: 'KIOSK_YOU_ARE_HERE',
      workspaceInstanceId: null,
      x: 500,
      y: 400,
      width: 80,
      height: 80,
      rotation: 90,
      zIndex: 2,
      label: 'Kiosk Entrance',
      properties: { color: '#B91C1C', markerType: 'KIOSK_YOU_ARE_HERE' },
      isLocked: false,
    },
  ];

  const updatedDraft = await mapService.saveDraft({
    floorId: floorA.id,
    canvasWidth: 1200,
    canvasHeight: 800,
    gridSize: 20,
    elements: updatedElements,
    actorUserId: 'admin-1',
  });

  const updatedMarker = updatedDraft.elements.find(
    (e) => e.elementType === 'KIOSK_YOU_ARE_HERE'
  );
  assert.ok(updatedMarker);
  assert.equal(updatedMarker.x, 500);
  assert.equal(updatedMarker.y, 400);
  assert.equal(updatedMarker.rotation, 90);
  assert.equal(updatedMarker.label, 'Kiosk Entrance');
  console.log('✓ Case 4 passed: Kiosk marker reposition and update succeeded');

  // 5. Publishing floor map preserves the kiosk marker
  const publishResult = await mapService.publishDraft({
    floorId: floorA.id,
    actorUserId: 'admin-1',
  });
  assert.ok(publishResult, 'Draft published successfully');

  // 6. Audience isolation test on PublishedMapRepository
  const publishedMapRepo = new InMemoryPublishedMapRepository();
  const publishedMapService = createPublishedMapService(publishedMapRepo);

  const mockPublishedFloorMap: PublishedFloorMap = {
    floor: {
      id: floorA.id,
      name: floorA.name,
      floorNumber: floorA.floorNumber,
      displayOrder: floorA.displayOrder,
      isActive: true,
    },
    version: {
      id: 'version-floor-a',
      versionNumber: 1,
      canvasWidth: 1200,
      canvasHeight: 800,
      gridSize: 20,
      publishedAt: new Date().toISOString(),
    },
    elements: [
      {
        id: 'element-desk-1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 100,
        y: 100,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: 1,
        label: 'Desk A1',
        style: { color: '#009689' },
        workspace: {
          workspaceInstanceId: desk1.id,
          templateId: template.id,
          floorId: floorA.id,
          instanceCode: 'A1',
          displayName: 'Desk A1',
          templateName: template.name,
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
        id: 'element-kiosk-1',
        elementRole: 'INFORMATION',
        elementType: 'KIOSK_YOU_ARE_HERE',
        x: 500,
        y: 400,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: 2,
        label: 'You Are Here',
        style: { color: '#DC2626', markerType: 'KIOSK_YOU_ARE_HERE' },
        workspace: null,
      },
    ],
  };

  publishedMapRepo.seedPublishedFloorMap(mockPublishedFloorMap);

  // Audience: KIOSK receives the kiosk marker
  const kioskPayload = await publishedMapService.loadPublishedFloorMap(
    floorA.id,
    { audience: 'KIOSK' }
  );
  assert.equal(kioskPayload.elements.length, 2, 'Kiosk audience should receive 2 elements');
  const kioskFound = kioskPayload.elements.find(
    (e) => e.elementType === 'KIOSK_YOU_ARE_HERE'
  );
  assert.ok(kioskFound, 'Kiosk audience should receive KIOSK_YOU_ARE_HERE element');
  assert.equal(kioskFound.label, 'You Are Here');
  console.log('✓ Case 6a passed: Kiosk audience receives You Are Here marker');

  // Audience: ADMIN also receives the kiosk marker
  const adminPayload = await publishedMapService.loadPublishedFloorMap(
    floorA.id,
    { audience: 'ADMIN' }
  );
  assert.equal(adminPayload.elements.length, 2, 'Admin audience should receive 2 elements');
  console.log('✓ Case 6b passed: Admin audience receives You Are Here marker');

  // Audience: CUSTOMER receives kiosk marker for floor orientation preview
  const customerPayload = await publishedMapService.loadPublishedFloorMap(
    floorA.id,
    { audience: 'CUSTOMER' }
  );
  assert.equal(
    customerPayload.elements.length,
    2,
    'Customer audience should receive 2 elements'
  );
  const customerMarker = customerPayload.elements.find(
    (e) => e.elementType === 'KIOSK_YOU_ARE_HERE'
  );
  assert.ok(
    customerMarker,
    'Customer payload includes KIOSK_YOU_ARE_HERE orientation marker'
  );
  console.log('✓ Case 6c passed: Customer audience receives Kiosk orientation marker');

  // Audience: STAFF receives kiosk marker for floor orientation preview
  const staffPayload = await publishedMapService.loadPublishedFloorMap(
    floorA.id,
    { audience: 'STAFF' }
  );
  assert.equal(
    staffPayload.elements.length,
    2,
    'Staff audience should receive 2 elements'
  );
  const staffMarker = staffPayload.elements.find(
    (e) => e.elementType === 'KIOSK_YOU_ARE_HERE'
  );
  assert.ok(
    staffMarker,
    'Staff payload includes KIOSK_YOU_ARE_HERE orientation marker'
  );
  console.log('✓ Case 6d passed: Staff audience receives Kiosk orientation marker');

  // Audience: default (undefined) receives kiosk marker
  const defaultPayload = await publishedMapService.loadPublishedFloorMap(floorA.id);
  assert.equal(
    defaultPayload.elements.length,
    2,
    'Default audience should receive 2 elements'
  );
  console.log('✓ Case 6e passed: Default audience receives Kiosk orientation marker');

  console.log('\n✅ All M16 Kiosk "You Are Here" Marker tests passed successfully!\n');
}

run().catch((err) => {
  console.error('❌ M16 test failure:', err);
  process.exit(1);
});

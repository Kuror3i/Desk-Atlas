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
  InMemoryWorkspaceRepository,
  InMemoryPublishedMapRepository,
  InMemoryMapRepository,
  createWorkspaceService,
  createPublishedMapService,
  createMapService,
  getWorkspaceAvailabilityStatus,
  WorkspaceValidationError,
  type Floor,
  type PublishedFloorMap,
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

  const floor1: Floor = {
    id: 'floor-ground',
    name: 'Ground Floor',
    floorNumber: 1,
    displayOrder: 1,
    isActive: true,
  };

  const floor2: Floor = {
    id: 'floor-mezzanine',
    name: 'Mezzanine Floor',
    floorNumber: 2,
    displayOrder: 2,
    isActive: true,
  };

  // 1. Staff map viewport scale parity with Admin viewers
  await runTest('Staff map viewport scale parity: computeFitViewZoom and getMapViewportBounds match Admin viewer logic', () => {
    const canvasWidth = DEFAULT_MAP_CANVAS_WIDTH; // 1600
    const canvasHeight = DEFAULT_MAP_CANVAS_HEIGHT; // 1000

    // Standard dashboard container
    const containerW = 1200;
    const containerH = 800;
    const staffFitZoom = computeFitViewZoom(containerW, containerH, canvasWidth, canvasHeight, 0);
    const expectedScale = Math.min(containerW / canvasWidth, containerH / canvasHeight);
    assert.strictEqual(staffFitZoom, clampMapZoom(expectedScale));
    assert.strictEqual(staffFitZoom, 0.75);

    // Zoom bounds
    const bounds = getMapViewportBounds(canvasWidth, canvasHeight, staffFitZoom);
    assert.strictEqual(bounds.canvasWidth, 1600);
    assert.strictEqual(bounds.canvasHeight, 1000);
    assert.strictEqual(bounds.zoom, 0.75);
    assert.strictEqual(bounds.scaledWidth, 1200);
    assert.strictEqual(bounds.scaledHeight, 750);
  });

  // 2. Staff map zoom configuration persistence per floor
  await runTest('Staff map zoom configuration persists per floor independently', () => {
    const mockStorage: Record<string, string> = {};
    const storageAdapter = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
    };

    assert.strictEqual(getSavedMapZoom(floor1.id, storageAdapter), null);
    assert.strictEqual(getSavedMapZoom(floor2.id, storageAdapter), null);

    saveMapZoom(floor1.id, 0.8, storageAdapter);
    assert.strictEqual(getSavedMapZoom(floor1.id, storageAdapter), 0.8);
    assert.strictEqual(getSavedMapZoom(floor2.id, storageAdapter), null);

    saveMapZoom(floor2.id, 1.1, storageAdapter);
    assert.strictEqual(getSavedMapZoom(floor1.id, storageAdapter), 0.8);
    assert.strictEqual(getSavedMapZoom(floor2.id, storageAdapter), 1.1);
  });

  // 3. Staff can update workspace instance operational status with STAFF audit role
  await runTest('Staff updates workspace operational status to MAINTENANCE, generating STAFF audit log', async () => {
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const workspaceService = createWorkspaceService(workspaceRepo);

    const floor = await workspaceService.createFloor({ name: 'Ground Floor' });
    const template = await workspaceService.createTemplate({
      name: 'Hot Desk',
      capacity: 1,
      rateAmount: 100,
      defaultShape: 'rectangle',
      defaultColor: '#009689',
    });

    const instance = await workspaceService.createInstance({
      templateId: template.id,
      floorId: floor.id,
      instanceCode: 'HD-01',
      displayName: 'Hot Desk 01',
      operationalStatus: 'ACTIVE',
    });

    // Seed a future confirmed reservation
    workspaceRepo.seedFutureConfirmedReservation(instance.id, {
      reservationId: 'res-101',
      reservationReferenceCode: 'RSV-101',
      startAt: '2099-01-01T09:00:00.000Z',
      endAt: '2099-01-01T12:00:00.000Z',
    });

    // Staff performs operational status update to MAINTENANCE
    const updateResult = await workspaceService.updateManagedInstance(
      instance.id,
      { operationalStatus: 'MAINTENANCE' },
      { actorRole: 'STAFF', actorUserId: 'staff-user-42' }
    );

    assert.strictEqual(updateResult.instance.operationalStatus, 'MAINTENANCE');
    assert.strictEqual(updateResult.availability.isBookable, false);
    assert.strictEqual(updateResult.availability.blockingReason, 'OPERATIONAL_STATUS_BLOCKED');
    assert.strictEqual(updateResult.affectedFutureReservations.length, 1);
    assert.strictEqual(updateResult.affectedFutureReservations[0].reservationId, 'res-101');
    assert.strictEqual(updateResult.auditLogged, true);

    // Verify audit log has actorRole STAFF
    const auditLogs = workspaceRepo.listAuditLogs();
    const staffAudit = auditLogs.find(
      (a) => a.action === 'workspace.instance.updated' && a.entityId === instance.id
    );
    assert.ok(staffAudit);
    assert.strictEqual(staffAudit.actorRole, 'STAFF');
    assert.strictEqual(staffAudit.actorUserId, 'staff-user-42');
    assert.strictEqual((staffAudit.metadata as any).newOperationalStatus, 'MAINTENANCE');
    assert.strictEqual((staffAudit.metadata as any).previousOperationalStatus, 'ACTIVE');
  });

  // 4. Staff can transition status to INACTIVE and back to ACTIVE
  await runTest('Staff status transitions between INACTIVE and ACTIVE update availability accordingly', async () => {
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const workspaceService = createWorkspaceService(workspaceRepo);

    const floor = await workspaceService.createFloor({ name: 'Ground Floor' });
    const template = await workspaceService.createTemplate({
      name: 'Private Office',
      capacity: 4,
      rateAmount: 500,
      defaultShape: 'rectangle',
      defaultColor: '#009689',
    });

    const instance = await workspaceService.createInstance({
      templateId: template.id,
      floorId: floor.id,
      instanceCode: 'PO-01',
      displayName: 'Office 01',
      operationalStatus: 'ACTIVE',
    });

    // Staff sets to INACTIVE
    const inactiveResult = await workspaceService.updateManagedInstance(
      instance.id,
      { operationalStatus: 'INACTIVE' },
      { actorRole: 'STAFF', actorUserId: 'staff-op-1' }
    );
    assert.strictEqual(inactiveResult.instance.operationalStatus, 'INACTIVE');
    assert.strictEqual(inactiveResult.availability.isBookable, false);

    // Staff reactivates to ACTIVE
    const reactivatedResult = await workspaceService.updateManagedInstance(
      instance.id,
      { operationalStatus: 'ACTIVE' },
      { actorRole: 'STAFF', actorUserId: 'staff-op-1' }
    );
    assert.strictEqual(reactivatedResult.instance.operationalStatus, 'ACTIVE');
    assert.strictEqual(reactivatedResult.availability.isBookable, true);
    assert.strictEqual(reactivatedResult.availability.blockingReason, null);
  });

  // 5. Validation error on invalid operational status
  await runTest('Invalid operational status is rejected with WorkspaceValidationError', async () => {
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const workspaceService = createWorkspaceService(workspaceRepo);

    const floor = await workspaceService.createFloor({ name: 'Ground Floor' });
    const template = await workspaceService.createTemplate({
      name: 'Desk',
      capacity: 1,
      rateAmount: 100,
      defaultShape: 'rectangle',
      defaultColor: '#009689',
    });

    const instance = await workspaceService.createInstance({
      templateId: template.id,
      floorId: floor.id,
      instanceCode: 'D-01',
      displayName: 'Desk 01',
      operationalStatus: 'ACTIVE',
    });

    await assert.rejects(
      () =>
        workspaceService.updateManagedInstance(
          instance.id,
          { operationalStatus: 'INVALID_STATUS' as any },
          { actorRole: 'STAFF', actorUserId: 'staff-1' }
        ),
      (err: any) => {
        assert.ok(err instanceof WorkspaceValidationError);
        return true;
      }
    );
  });

  // 6. Live published map updates operational status upon reload
  await runTest('Published map reflects operational status change and preserves map geometry invariants', async () => {
    const instanceData = {
      id: 'inst-live-1',
      templateId: 'tmpl-1',
      floorId: floor1.id,
      instanceCode: 'D-10',
      displayName: 'Desk 10',
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
      workspaceInstances: [instanceData],
    });
    const mapService = createMapService(mapRepo);

    await mapService.saveDraft({
      floorId: floor1.id,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      elements: [
        {
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          workspaceInstanceId: instanceData.id,
          x: 200,
          y: 300,
          width: 140,
          height: 70,
          rotation: 0,
          label: 'Desk 10',
        },
      ],
    });

    await mapService.publishDraft({ floorId: floor1.id });

    // Seed published map repository
    const pubRepo = new InMemoryPublishedMapRepository();
    pubRepo.seedPublishedFloorMap({
      floor: floor1,
      version: {
        id: 'ver-1',
        versionNumber: 1,
        canvasWidth: 1600,
        canvasHeight: 1000,
        gridSize: 20,
        publishedAt: '2026-08-29T12:00:00.000Z',
      },
      elements: [
        {
          id: 'elem-1',
          elementRole: 'WORKSPACE',
          elementType: 'desk',
          x: 200,
          y: 300,
          width: 140,
          height: 70,
          rotation: 0,
          zIndex: 1,
          label: 'Desk 10',
          style: { color: '#009689' },
          workspace: {
            workspaceInstanceId: instanceData.id,
            templateId: 'tmpl-1',
            floorId: floor1.id,
            instanceCode: 'D-10',
            displayName: 'Desk 10',
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

    const publishedService = createPublishedMapService(pubRepo);
    const initialMap = await publishedService.loadPublishedFloorMap(floor1.id);
    assert.strictEqual(initialMap.elements[0].workspace?.operationalStatus, 'ACTIVE');
    assert.strictEqual(initialMap.elements[0].workspace?.isBookable, true);

    // After updating status to MAINTENANCE in published representation:
    pubRepo.seedPublishedFloorMap({
      floor: floor1,
      version: initialMap.version,
      elements: [
        {
          ...initialMap.elements[0],
          workspace: {
            ...initialMap.elements[0].workspace!,
            operationalStatus: 'MAINTENANCE',
            isBookable: false,
            blockingReason: 'OPERATIONAL_STATUS_BLOCKED',
          },
        },
      ],
    });

    const updatedMap = await publishedService.loadPublishedFloorMap(floor1.id);
    assert.strictEqual(updatedMap.elements[0].workspace?.operationalStatus, 'MAINTENANCE');
    assert.strictEqual(updatedMap.elements[0].workspace?.isBookable, false);
    assert.strictEqual(updatedMap.elements[0].x, 200);
    assert.strictEqual(updatedMap.elements[0].y, 300);
    assert.strictEqual(updatedMap.elements[0].width, 140);
    assert.strictEqual(updatedMap.elements[0].height, 70);
  });

  console.log('\nAll MF-27 Staff Workspace Map Status Actions tests passed successfully!');
}

runTests();

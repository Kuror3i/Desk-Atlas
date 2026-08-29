import assert from 'node:assert/strict';
import {
  InMemoryMapRepository,
  InMemoryWorkspaceRepository,
  createMapService,
  createWorkspaceService,
  type MapElementInput,
} from '../packages/domain/src/index';

async function run() {
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const workspaceService = createWorkspaceService(workspaceRepo);
  const floor = await workspaceService.createFloor({ name: 'Floor 1' });

  // Create a template and instance for bookable workspace to verify non-wall sizing
  const deskTemplate = await workspaceService.createTemplate({
    name: 'Standard Desk',
    capacity: 1,
    rateAmount: 100,
    defaultShape: 'desk',
    defaultColor: '#009689',
  });

  const deskInstance = await workspaceService.createInstanceFromTemplate({
    templateId: deskTemplate.id,
    floorId: floor.id,
  });

  const mapRepo = new InMemoryMapRepository({
    floors: [floor],
    workspaceInstances: [
      { id: deskInstance.id, floorId: floor.id, operationalStatus: 'ACTIVE' },
    ],
  });
  const mapService = createMapService(mapRepo);

  // 1. Create walls and non-wall elements
  // Attempt to save wall with height 80 (should normalize to fixed thin height 20)
  // Non-walls (pantry, restroom, zone, desk) have custom heights that must be preserved
  const elementsToSave: MapElementInput[] = [
    {
      id: 'wall-solid-1',
      elementRole: 'STRUCTURE',
      elementType: 'wall_solid',
      x: 100,
      y: 100,
      width: 240,
      height: 80, // Attempted custom height for wall
      rotation: 0,
      zIndex: 1,
      label: 'North Wall',
    },
    {
      id: 'wall-glass-1',
      elementRole: 'STRUCTURE',
      elementType: 'wall_glass',
      x: 100,
      y: 200,
      width: 160,
      height: 120, // Attempted custom height for glass wall
      rotation: 90,
      zIndex: 2,
      label: 'Glass Divider',
    },
    {
      id: 'pantry-1',
      elementRole: 'STRUCTURE',
      elementType: 'pantry',
      x: 400,
      y: 100,
      width: 200,
      height: 140, // Non-wall height must be preserved
      rotation: 0,
      zIndex: 3,
      label: 'Pantry Area',
    },
    {
      id: 'restroom-1',
      elementRole: 'STRUCTURE',
      elementType: 'restroom',
      x: 640,
      y: 100,
      width: 120,
      height: 120, // Non-wall height must be preserved
      rotation: 0,
      zIndex: 4,
      label: 'Restroom',
    },
    {
      id: 'desk-1',
      elementRole: 'WORKSPACE',
      elementType: 'desk',
      workspaceInstanceId: deskInstance.id,
      x: 100,
      y: 300,
      width: 80,
      height: 60, // Workspace height must be preserved
      rotation: 180,
      zIndex: 5,
      label: deskInstance.displayName,
    },
  ];

  // 2. Save draft
  const savedDraft = await mapService.saveDraft({
    floorId: floor.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements: elementsToSave,
  });

  assert.ok(savedDraft);
  assert.equal(savedDraft.elements.length, 5);

  // 3. Reload draft and verify wall heights are fixed to 20, while width and rotation are preserved
  const loadedDraft = await mapService.loadDraft(floor.id);
  assert.ok(loadedDraft);

  const solidWall = loadedDraft.elements.find((e) => e.id === 'wall-solid-1');
  assert.ok(solidWall);
  assert.equal(solidWall.width, 240, 'Wall width must be preserved');
  assert.equal(solidWall.height, 20, 'Wall height must be normalized to fixed thin value (20)');
  assert.equal(solidWall.rotation, 0);

  const glassWall = loadedDraft.elements.find((e) => e.id === 'wall-glass-1');
  assert.ok(glassWall);
  assert.equal(glassWall.width, 160, 'Wall width must be preserved');
  assert.equal(glassWall.height, 20, 'Wall height must be normalized to fixed thin value (20)');
  assert.equal(glassWall.rotation, 90, 'Wall rotation must be preserved');

  // Verify non-wall elements retain their non-wall dimensions
  const pantryEl = loadedDraft.elements.find((e) => e.id === 'pantry-1');
  assert.ok(pantryEl);
  assert.equal(pantryEl.width, 200);
  assert.equal(pantryEl.height, 140, 'Pantry height must not be forced to 20');

  const restroomEl = loadedDraft.elements.find((e) => e.id === 'restroom-1');
  assert.ok(restroomEl);
  assert.equal(restroomEl.width, 120);
  assert.equal(restroomEl.height, 120, 'Restroom height must not be forced to 20');

  const deskEl = loadedDraft.elements.find((e) => e.id === 'desk-1');
  assert.ok(deskEl);
  assert.equal(deskEl.width, 80);
  assert.equal(deskEl.height, 60, 'Desk height must not be forced to 20');

  // 4. Update wall width to 320 and verify persistence
  const updatedElements = loadedDraft.elements.map((el) => {
    if (el.id === 'wall-solid-1') {
      return { ...el, width: 320, height: 999 }; // Attempt to set height to 999
    }
    return el;
  });

  await mapService.saveDraft({
    floorId: floor.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements: updatedElements,
  });

  const reloadedDraft = await mapService.loadDraft(floor.id);
  assert.ok(reloadedDraft);

  const updatedSolidWall = reloadedDraft.elements.find((e) => e.id === 'wall-solid-1');
  assert.ok(updatedSolidWall);
  assert.equal(updatedSolidWall.width, 320, 'Adjusted wall width must persist');
  assert.equal(updatedSolidWall.height, 20, 'Wall height must remain fixed at 20');

  // 5. Publish Map and verify published map preserves wall rules
  const publishResult = await mapService.publishDraft({
    floorId: floor.id,
    actorUserId: 'admin-tester',
  });
  assert.ok(publishResult.published);

  const publishedMap = await mapService.loadPublished(floor.id);
  assert.ok(publishedMap);

  const pubWall = publishedMap.elements.find((e) => e.id === 'wall-solid-1');
  assert.ok(pubWall);
  assert.equal(pubWall.width, 320);
  assert.equal(pubWall.height, 20);

  const pubPantry = publishedMap.elements.find((e) => e.id === 'pantry-1');
  assert.ok(pubPantry);
  assert.equal(pubPantry.width, 200);
  assert.equal(pubPantry.height, 140);

  // 6. Test Thin Wall with 10px half-thickness and standard grid snapping
  await mapService.saveDraft({
    floorId: floor.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements: [
      {
        id: 'thin-wall-1',
        elementRole: 'STRUCTURE',
        elementType: 'thin_wall',
        x: 160,
        y: 280,
        width: 200,
        height: 60, // Attempted non-10 height for thin wall
        rotation: 90,
        label: 'Desk Thin Wall',
      },
      {
        id: 'glass-1',
        elementRole: 'STRUCTURE',
        elementType: 'glass',
        x: 360,
        y: 280,
        width: 140,
        height: 80, // Attempted non-20 height for glass
        rotation: 0,
        label: 'Glass Panel',
      },
    ],
  });

  const thinDraft = await mapService.loadDraft(floor.id);
  assert.ok(thinDraft);

  const thinEl = thinDraft.elements.find((e) => e.id === 'thin-wall-1');
  assert.ok(thinEl);
  assert.equal(thinEl.x, 160, 'Thin wall snaps to standard grid X coordinate');
  assert.equal(thinEl.y, 280, 'Thin wall snaps to standard grid Y coordinate');
  assert.equal(thinEl.width, 200, 'Thin wall width must be preserved');
  assert.equal(thinEl.height, 10, 'Thin wall height must be normalized to half-thickness (10px)');
  assert.equal(thinEl.rotation, 90);

  const glassEl = thinDraft.elements.find((e) => e.id === 'glass-1');
  assert.ok(glassEl);
  assert.equal(glassEl.width, 140, 'Glass width must be preserved');
  assert.equal(glassEl.height, 20, 'Glass height must be normalized to 20px');

  console.log('MF-06 wall structure sizing rules tests passed successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

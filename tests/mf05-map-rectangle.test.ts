import assert from 'node:assert/strict';
import {
  InMemoryMapRepository,
  InMemoryWorkspaceRepository,
  createMapService,
  createWorkspaceService,
  type Floor,
  type MapElementInput,
} from '../packages/domain/src/index';

async function run() {
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const workspaceService = createWorkspaceService(workspaceRepo);
  const floor = await workspaceService.createFloor({ name: 'Floor 1' });

  // 1. Create a template with rectangle default shape
  const rectTemplate = await workspaceService.createTemplate({
    name: 'Conference Room Alpha',
    capacity: 10,
    rateAmount: 800,
    defaultShape: 'rectangle',
    defaultColor: '#009689',
  });
  assert.equal(rectTemplate.defaultShape, 'rectangle');

  // 2. Create an instance of the rectangle template
  const rectInstance = await workspaceService.createInstanceFromTemplate({
    templateId: rectTemplate.id,
    floorId: floor.id,
  });
  assert.ok(rectInstance.id);
  assert.equal(rectInstance.template.defaultShape, 'rectangle');

  // 3. Create a template with square default shape
  const squareTemplate = await workspaceService.createTemplate({
    name: 'Solo Pod Beta',
    capacity: 1,
    rateAmount: 150,
    defaultShape: 'square',
    defaultColor: '#009689',
  });
  assert.equal(squareTemplate.defaultShape, 'square');

  const squareInstance = await workspaceService.createInstanceFromTemplate({
    templateId: squareTemplate.id,
    floorId: floor.id,
  });

  // Map service
  const mapRepo = new InMemoryMapRepository({
    floors: [floor],
    workspaceInstances: [
      { id: rectInstance.id, floorId: floor.id, operationalStatus: 'ACTIVE' },
      { id: squareInstance.id, floorId: floor.id, operationalStatus: 'ACTIVE' },
    ],
  });
  const mapService = createMapService(mapRepo);

  // 4. Place rectangle workspace on canvas with non-square dimensions (120x80)
  // and square workspace with equal dimensions (80x80)
  const rectWidth = 120;
  const rectHeight = 80;
  const squareWidth = 80;
  const squareHeight = 80;

  const elementsToSave: MapElementInput[] = [
    {
      id: 'element-rect-1',
      elementRole: 'WORKSPACE',
      elementType: rectTemplate.defaultShape,
      workspaceInstanceId: rectInstance.id,
      x: 60,
      y: 60,
      width: rectWidth,
      height: rectHeight,
      rotation: 0,
      zIndex: 1,
      label: rectInstance.displayName,
      properties: { color: rectTemplate.defaultColor },
    },
    {
      id: 'element-square-1',
      elementRole: 'WORKSPACE',
      elementType: squareTemplate.defaultShape,
      workspaceInstanceId: squareInstance.id,
      x: 220,
      y: 60,
      width: squareWidth,
      height: squareHeight,
      rotation: 0,
      zIndex: 2,
      label: squareInstance.displayName,
      properties: { color: squareTemplate.defaultColor },
    },
  ];

  // 5. Save Draft
  const savedDraft = await mapService.saveDraft({
    floorId: floor.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements: elementsToSave,
  });

  assert.ok(savedDraft);
  assert.equal(savedDraft.elements.length, 2);

  // 6. Reload Draft and verify rectangular proportions are preserved (width !== height)
  const loadedDraft = await mapService.loadDraft(floor.id);
  assert.ok(loadedDraft);

  const draftRectEl = loadedDraft.elements.find((e) => e.workspaceInstanceId === rectInstance.id);
  assert.ok(draftRectEl);
  assert.equal(draftRectEl.width, 120);
  assert.equal(draftRectEl.height, 80);
  assert.notEqual(draftRectEl.width, draftRectEl.height, 'Rectangle width and height must not be squared');

  const draftSquareEl = loadedDraft.elements.find((e) => e.workspaceInstanceId === squareInstance.id);
  assert.ok(draftSquareEl);
  assert.equal(draftSquareEl.width, 80);
  assert.equal(draftSquareEl.height, 80);

  // 7. Publish Map and verify published map preserves rectangular geometry
  const publishResult = await mapService.publishDraft({
    floorId: floor.id,
    actorUserId: 'admin-tester',
  });
  assert.ok(publishResult.published);

  const publishedMap = await mapService.loadPublished(floor.id);
  assert.ok(publishedMap);

  const pubRectEl = publishedMap.elements.find((e) => e.workspaceInstanceId === rectInstance.id);
  assert.ok(pubRectEl);
  assert.equal(pubRectEl.width, 120);
  assert.equal(pubRectEl.height, 80);

  const pubSquareEl = publishedMap.elements.find((e) => e.workspaceInstanceId === squareInstance.id);
  assert.ok(pubSquareEl);
  assert.equal(pubSquareEl.width, 80);
  assert.equal(pubSquareEl.height, 80);

  console.log('MF-05 rectangle workspace geometry tests passed successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

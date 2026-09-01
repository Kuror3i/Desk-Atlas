import assert from 'node:assert/strict';
import {
  InMemoryMapRepository,
  createMapService,
  InMemoryPublishedMapRepository,
  createPublishedMapService,
  type Floor,
  type MapElementInput,
} from '../packages/domain/src/index';

const floor: Floor = {
  id: 'floor-test',
  name: 'Main Floor',
  floorNumber: 1,
  displayOrder: 1,
  isActive: true,
};

async function testMF07() {
  const mapRepo = new InMemoryMapRepository({
    floors: [floor],
    workspaceInstances: [],
  });
  const mapService = createMapService(mapRepo);

  // 1. Save draft with Restroom, Pantry, and Emergency Exit elements
  const elements: MapElementInput[] = [
    {
      id: 'elem-restroom',
      elementRole: 'AMENITY',
      elementType: 'restroom',
      x: 60,
      y: 60,
      width: 100,
      height: 80,
      rotation: 0,
      zIndex: 1,
      label: 'Restroom',
      properties: { color: '#E0F2FE', icon: 'restroom' },
    },
    {
      id: 'elem-pantry',
      elementRole: 'AMENITY',
      elementType: 'pantry',
      x: 180,
      y: 60,
      width: 100,
      height: 80,
      rotation: 0,
      zIndex: 2,
      label: 'Pantry',
      properties: { color: '#FEF3C7', icon: 'pantry' },
    },
    {
      id: 'elem-exit',
      elementRole: 'AMENITY',
      elementType: 'emergency_exit',
      x: 300,
      y: 60,
      width: 100,
      height: 80,
      rotation: 0,
      zIndex: 3,
      label: 'Emergency Exit',
      properties: { color: '#DCFCE7', icon: 'emergency_exit' },
    },
  ];

  await mapService.saveDraft({
    floorId: floor.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements,
  });

  const draft = await mapService.loadDraft(floor.id);
  assert.ok(draft, 'Draft map must exist');
  assert.equal(draft.elements.length, 3);

  // Validate restroom
  const restroom = draft.elements.find((el) => el.id === 'elem-restroom');
  assert.ok(restroom);
  assert.equal(restroom.elementRole, 'AMENITY');
  assert.equal(restroom.elementType, 'restroom');
  assert.equal(restroom.properties.color, '#E0F2FE');
  assert.equal(restroom.workspaceInstanceId, null);

  // Validate pantry
  const pantry = draft.elements.find((el) => el.id === 'elem-pantry');
  assert.ok(pantry);
  assert.equal(pantry.elementRole, 'AMENITY');
  assert.equal(pantry.elementType, 'pantry');
  assert.equal(pantry.properties.color, '#FEF3C7');
  assert.equal(pantry.workspaceInstanceId, null);

  // Validate emergency exit
  const exit = draft.elements.find((el) => el.id === 'elem-exit');
  assert.ok(exit);
  assert.equal(exit.elementRole, 'AMENITY');
  assert.equal(exit.elementType, 'emergency_exit');
  assert.equal(exit.properties.color, '#DCFCE7');
  assert.equal(exit.workspaceInstanceId, null);

  // 2. Publish draft and verify published DTO
  const publishResult = await mapService.publishDraft({ floorId: floor.id });
  assert.equal(publishResult.published.elements.length, 3);

  // 3. Published map delivery
  const pubRepo = new InMemoryPublishedMapRepository();
  pubRepo.seedPublishedFloorMap({
    floor,
    version: {
      id: publishResult.published.version.id,
      versionNumber: 1,
      canvasWidth: 1600,
      canvasHeight: 1000,
      gridSize: 20,
      publishedAt: new Date().toISOString(),
    },
    elements: publishResult.published.elements.map((el) => ({
      id: el.id,
      elementRole: el.elementRole as 'AMENITY',
      elementType: el.elementType,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      zIndex: el.zIndex,
      label: el.label,
      style: (el.properties as Record<string, string>) || {},
      workspace: null,
    })),
  });

  const pubService = createPublishedMapService(pubRepo);
  const publishedMap = await pubService.loadPublishedFloorMap(floor.id);
  assert.ok(publishedMap);
  assert.equal(publishedMap.elements.length, 3);
  for (const el of publishedMap.elements) {
    assert.equal(el.elementRole, 'AMENITY');
    assert.equal(el.workspace, null, 'Amenities must never be linked to workspace inventory');
    assert.ok(el.style.color, 'Amenity color must be present in style DTO');
  }

  console.log('MF-07 amenity tests passed successfully');
}

testMF07().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

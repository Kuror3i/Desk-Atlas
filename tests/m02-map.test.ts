import assert from 'node:assert/strict';
import {
  InMemoryMapRepository,
  MapConflictError,
  MapValidationError,
  createMapService,
  type Floor,
  type MapElementInput,
} from '../packages/domain/src/index';

const floorA: Floor = {
  id: 'floor-a',
  name: 'Floor A',
  floorNumber: 1,
  displayOrder: 0,
  isActive: true,
};

const floorB: Floor = {
  id: 'floor-b',
  name: 'Floor B',
  floorNumber: 2,
  displayOrder: 1,
  isActive: true,
};

const workspaceA1 = {
  id: 'instance-a-1',
  floorId: floorA.id,
  operationalStatus: 'ACTIVE',
};

const workspaceA2 = {
  id: 'instance-a-2',
  floorId: floorA.id,
  operationalStatus: 'ACTIVE',
};

const workspaceB1 = {
  id: 'instance-b-1',
  floorId: floorB.id,
  operationalStatus: 'ACTIVE',
};

async function run() {
  const repository = new InMemoryMapRepository({
    floors: [floorA, floorB],
    workspaceInstances: [workspaceA1, workspaceA2, workspaceB1],
  });
  const service = createMapService(repository);

  const originalElements: MapElementInput[] = [
    {
      id: 'element-bookable-a1',
      elementRole: 'WORKSPACE',
      elementType: 'desk',
      workspaceInstanceId: workspaceA1.id,
      x: 100.125,
      y: 120.5,
      width: 80,
      height: 60,
      rotation: 90,
      zIndex: 2,
      label: 'A1',
      properties: { color: '#009689', shape: 'rounded-rectangle' },
      isLocked: false,
    },
    {
      id: 'element-zone-a',
      elementRole: 'STRUCTURE',
      elementType: 'zone',
      x: 40,
      y: 80,
      width: 300,
      height: 200,
      rotation: 0,
      zIndex: 1,
      label: 'Zone A',
      properties: { color: 'rgba(0, 150, 137, 0.1)' },
      isLocked: true,
    },
  ];

  const saved = await service.saveDraft({
    floorId: floorA.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    elements: originalElements,
  });
  const reloaded = await service.loadDraft(floorA.id);

  assert.ok(reloaded);
  assert.equal(saved.version.id, reloaded.version.id);
  assert.deepEqual(
    reloaded.elements.map((element) => ({
      id: element.id,
      role: element.elementRole,
      type: element.elementType,
      workspaceInstanceId: element.workspaceInstanceId,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      zIndex: element.zIndex,
      label: element.label,
      properties: element.properties,
      isLocked: element.isLocked,
    })),
    [
      {
        id: 'element-zone-a',
        role: 'STRUCTURE',
        type: 'zone',
        workspaceInstanceId: null,
        x: 40,
        y: 80,
        width: 300,
        height: 200,
        rotation: 0,
        zIndex: 1,
        label: 'Zone A',
        properties: { color: 'rgba(0, 150, 137, 0.1)' },
        isLocked: true,
      },
      {
        id: 'element-bookable-a1',
        role: 'WORKSPACE',
        type: 'desk',
        workspaceInstanceId: workspaceA1.id,
        x: 100.125,
        y: 120.5,
        width: 80,
        height: 60,
        rotation: 90,
        zIndex: 2,
        label: 'A1',
        properties: { color: '#009689', shape: 'rounded-rectangle' },
        isLocked: false,
      },
    ]
  );

  await assert.rejects(
    () =>
      service.saveDraft({
        floorId: floorA.id,
        elements: [
          {
            elementRole: 'WORKSPACE',
            elementType: 'desk',
            workspaceInstanceId: workspaceA1.id,
            x: 1,
            y: 1,
            width: 10,
            height: 10,
          },
          {
            elementRole: 'WORKSPACE',
            elementType: 'desk',
            workspaceInstanceId: workspaceA1.id,
            x: 20,
            y: 20,
            width: 10,
            height: 10,
          },
        ],
      }),
    MapConflictError
  );

  await assert.rejects(
    () =>
      service.saveDraft({
        floorId: floorA.id,
        elements: [
          {
            elementRole: 'STRUCTURE',
            elementType: 'wall',
            x: -1,
            y: 0,
            width: 10,
            height: 10,
          },
        ],
      }),
    MapValidationError
  );

  const publishedA1 = await service.publishDraft({ floorId: floorA.id, actorUserId: 'admin-user-1' });
  assert.equal(publishedA1.published.version.status, 'PUBLISHED');
  assert.equal(publishedA1.archivedVersionIds.length, 0);

  await service.saveDraft({
    floorId: floorB.id,
    elements: [
      {
        id: 'element-bookable-b1',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        workspaceInstanceId: workspaceB1.id,
        x: 10,
        y: 20,
        width: 80,
        height: 60,
      },
    ],
  });
  const publishedB = await service.publishDraft({ floorId: floorB.id });
  assert.equal(publishedB.published.floor.id, floorB.id);
  assert.equal((await service.loadPublished(floorA.id))?.version.id, publishedA1.published.version.id);

  await service.saveDraft({
    floorId: floorA.id,
    elements: [
      {
        id: 'element-bookable-a2',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        workspaceInstanceId: workspaceA2.id,
        x: 300,
        y: 120,
        width: 80,
        height: 60,
      },
    ],
  });
  const draftA2 = await service.loadDraft(floorA.id);
  assert.equal(draftA2?.elements[0].id, 'element-bookable-a2');
  assert.equal((await service.loadPublished(floorA.id))?.elements[1].id, 'element-bookable-a1');

  await repository.saveDraft({
    floorId: floorA.id,
    canvasWidth: 1600,
    canvasHeight: 1000,
    gridSize: 20,
    actorUserId: null,
    elements: [
      {
        id: 'element-invalid-publish',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
      },
    ],
  });
  await assert.rejects(() => service.publishDraft({ floorId: floorA.id }), MapValidationError);
  assert.equal((await service.loadPublished(floorA.id))?.version.id, publishedA1.published.version.id);

  await assert.rejects(
    () =>
      service.saveDraft({
        floorId: floorA.id,
        elements: [
          {
            elementRole: 'WORKSPACE',
            elementType: 'desk',
            workspaceInstanceId: workspaceB1.id,
            x: 1,
            y: 1,
            width: 80,
            height: 60,
          },
        ],
      }),
    MapValidationError
  );

  await service.saveDraft({
    floorId: floorA.id,
    elements: [
      {
        id: 'element-bookable-a2',
        elementRole: 'WORKSPACE',
        elementType: 'desk',
        workspaceInstanceId: workspaceA2.id,
        x: 300,
        y: 120,
        width: 80,
        height: 60,
      },
    ],
  });
  const publishedA2 = await service.publishDraft({ floorId: floorA.id });
  assert.deepEqual(publishedA2.archivedVersionIds, [publishedA1.published.version.id]);

  const floorAVersions = await repository.listVersions(floorA.id);
  assert.equal(floorAVersions.filter((version) => version.status === 'PUBLISHED').length, 1);
  assert.equal(floorAVersions.filter((version) => version.status === 'ARCHIVED').length, 1);
  assert.equal((await service.loadPublished(floorA.id))?.elements[0].id, 'element-bookable-a2');

  await service.saveDraft({
    floorId: floorA.id,
    elements: [
      {
        id: 'element-draft-only',
        elementRole: 'INFORMATION',
        elementType: 'label',
        x: 10,
        y: 10,
        width: 40,
        height: 20,
        label: 'Draft only',
      },
    ],
  });
  assert.equal((await service.loadPublished(floorA.id))?.elements[0].id, 'element-bookable-a2');
}

run()
  .then(() => {
    console.log('M02 map draft/publish tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

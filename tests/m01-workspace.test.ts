import assert from 'node:assert/strict';
import {
  InMemoryWorkspaceRepository,
  WorkspaceConflictError,
  WorkspaceValidationError,
  createWorkspaceService,
} from '../packages/domain/src/index';

async function run() {
  const repository = new InMemoryWorkspaceRepository();
  const service = createWorkspaceService(repository);

  const template = await service.createTemplate({
    name: 'Skypod Table',
    description: 'Shared skypod workspace tier',
    capacity: 1,
    rateAmount: 125,
    defaultColor: '#009689',
    defaultShape: 'desk',
  });

  let catalog = await service.listCatalog();
  assert.equal(catalog.templates.length, 1);
  assert.equal(catalog.templates[0].id, template.id);
  assert.equal(catalog.templates[0].capacity, 1);

  const updatedTemplate = await service.updateTemplate(template.id, {
    name: 'Skypod Table Updated',
    rateAmount: 150,
  });
  assert.equal(updatedTemplate.name, 'Skypod Table Updated');
  assert.equal(updatedTemplate.rateAmount, 150);

  const floorId = 'floor-default';
  const instances = await Promise.all([
    service.createInstance({
      templateId: template.id,
      floorId,
      instanceCode: 'SP-01',
      displayName: 'Skypod 01',
    }),
    service.createInstance({
      templateId: template.id,
      floorId,
      instanceCode: 'SP-02',
      displayName: 'Skypod 02',
    }),
    service.createInstance({
      templateId: template.id,
      floorId,
      instanceCode: 'SP-03',
      displayName: 'Skypod 03',
    }),
  ]);

  assert.deepEqual(
    instances.map((instance) => instance.templateId),
    [template.id, template.id, template.id]
  );

  const renamed = await service.updateInstance(instances[0].id, {
    displayName: 'Skypod 01 Window',
  });
  assert.equal(renamed.displayName, 'Skypod 01 Window');
  assert.equal(renamed.template.name, 'Skypod Table Updated');

  const statusChanged = await service.updateInstance(instances[1].id, {
    operationalStatus: 'MAINTENANCE',
  });
  assert.equal(statusChanged.operationalStatus, 'MAINTENANCE');

  catalog = await service.listCatalog();
  assert.equal(
    catalog.instances.find((instance) => instance.id === instances[0].id)?.operationalStatus,
    'ACTIVE'
  );
  assert.equal(
    catalog.instances.find((instance) => instance.id === instances[2].id)?.operationalStatus,
    'ACTIVE'
  );

  await service.updateTemplate(template.id, { rateAmount: 175 });
  const adminSpacesAfterRateChange = await service.listAdminSpaces();
  assert.equal(adminSpacesAfterRateChange.length, 3);
  assert.ok(adminSpacesAfterRateChange.every((space) => space.hourlyRate === 175));

  await service.deactivateInstance(instances[2].id);
  catalog = await service.listCatalog();
  assert.equal(
    catalog.instances.find((instance) => instance.id === instances[2].id)?.operationalStatus,
    'INACTIVE'
  );
  assert.equal((await service.listAdminSpaces()).length, 2);

  await assert.rejects(
    () =>
      service.createInstance({
        templateId: template.id,
        floorId,
        instanceCode: 'SP-01',
        displayName: 'Duplicate Code',
      }),
    WorkspaceConflictError
  );

  await assert.rejects(
    () =>
      service.createTemplate({
        name: 'Invalid Capacity',
        capacity: 0,
        rateAmount: 100,
      }),
    WorkspaceValidationError
  );

  await assert.rejects(
    () =>
      service.createTemplate({
        name: 'Invalid Rate',
        capacity: 1,
        rateAmount: -1,
      }),
    WorkspaceValidationError
  );

  await assert.rejects(
    () =>
      service.updateInstance(instances[0].id, {
        operationalStatus: 'RESERVED' as never,
      }),
    WorkspaceValidationError
  );
}

run()
  .then(() => {
    console.log('M01 workspace service tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

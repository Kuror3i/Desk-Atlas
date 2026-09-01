import assert from 'node:assert/strict';
import {
  InMemoryWorkspaceRepository,
  createWorkspaceService,
  getWorkspaceAvailabilityStatus,
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

  const instance = await service.createInstance({
    templateId: template.id,
    floorId: 'floor-default',
    instanceCode: 'SP-10',
    displayName: 'Skypod 10',
    operationalStatus: 'ACTIVE',
  });

  repository.seedFutureConfirmedReservation(instance.id, {
    reservationId: 'res-future',
    reservationReferenceCode: 'RSV-FUTURE',
    startAt: '2099-08-26T09:00:00.000Z',
    endAt: '2099-08-26T12:00:00.000Z',
  });
  repository.seedFutureConfirmedReservation(instance.id, {
    reservationId: 'res-history',
    reservationReferenceCode: 'RSV-HISTORY',
    startAt: '2000-08-26T09:00:00.000Z',
    endAt: '2000-08-26T12:00:00.000Z',
  });

  for (const status of ['ACTIVE', 'UNAVAILABLE', 'MAINTENANCE', 'BROKEN', 'INACTIVE'] as const) {
    const result = await service.updateManagedInstance(instance.id, { operationalStatus: status });
    assert.equal(result.instance.operationalStatus, status);
    assert.equal(result.availability.isBookable, status === 'ACTIVE');
  }

  const reactivated = await service.updateManagedInstance(instance.id, { operationalStatus: 'ACTIVE' });
  assert.equal(reactivated.availability.isBookable, true);
  assert.equal(reactivated.availability.blockingReason, null);

  const blockedByMaintenance = await service.updateManagedInstance(instance.id, {
    operationalStatus: 'MAINTENANCE',
  });
  assert.equal(blockedByMaintenance.availability.isBookable, false);
  assert.equal(blockedByMaintenance.availability.blockingReason, 'OPERATIONAL_STATUS_BLOCKED');
  assert.equal(blockedByMaintenance.affectedFutureReservations.length, 1);
  assert.equal(blockedByMaintenance.affectedFutureReservations[0].reservationId, 'res-future');
  assert.equal(
    blockedByMaintenance.affectedFutureReservations[0].candidateId,
    `${instance.id}:res-future`
  );

  const allReservationReferences = await repository.listFutureConfirmedReservations(
    instance.id,
    '1900-01-01T00:00:00.000Z'
  );
  assert.equal(allReservationReferences.length, 2);

  const deactivated = await service.updateManagedInstance(instance.id, { operationalStatus: 'INACTIVE' });
  assert.equal(deactivated.instance.operationalStatus, 'INACTIVE');
  const preservedReservationReferences = await repository.listFutureConfirmedReservations(
    instance.id,
    '1900-01-01T00:00:00.000Z'
  );
  assert.equal(preservedReservationReferences.length, 2);

  const templateInactive = await service.updateTemplate(template.id, { isActive: false });
  assert.equal(templateInactive.isActive, false);
  const availabilityAfterTemplateDeactivation = getWorkspaceAvailabilityStatus(
    await repository.getInstance(instance.id)
  );
  assert.equal(availabilityAfterTemplateDeactivation.isBookable, false);
  assert.equal(availabilityAfterTemplateDeactivation.blockingReason, 'TEMPLATE_INACTIVE');

  const auditLogs = repository.listAuditLogs();
  assert.ok(auditLogs.length >= 1);
  const maintenanceAudit = auditLogs.find((entry) => {
    return (
      entry.action === 'workspace.instance.updated' &&
      entry.metadata.newOperationalStatus === 'MAINTENANCE' &&
      entry.metadata.previousOperationalStatus === 'ACTIVE'
    );
  });
  assert.ok(maintenanceAudit);
  assert.equal(maintenanceAudit?.actorRole, 'SYSTEM');
  assert.equal(maintenanceAudit?.entityType, 'workspace_instance');
}

run()
  .then(() => {
    console.log('M03 workspace operational status tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

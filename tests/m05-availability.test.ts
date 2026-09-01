import assert from 'node:assert/strict';

import {
  AvailabilityValidationError,
  InMemoryAvailabilityRepository,
  createAvailabilityService,
} from '../packages/domain/src/index';

async function run() {
  const repository = new InMemoryAvailabilityRepository();
  repository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  repository.seedWorkspaceInstance({
    id: 'workspace-a1',
    templateId: 'template-desk',
    floorId: 'floor-a',
    instanceCode: 'A1',
    displayName: 'Desk A1',
    operationalStatus: 'ACTIVE',
  });
  repository.seedOperatingHours(1, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  repository.seedOperatingHours(2, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  repository.seedOperatingHours(3, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  repository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  repository.seedOperatingHours(5, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);

  const service = createAvailabilityService(repository);

  const normalDay = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-a1',
    date: '2099-08-27',
    durationMinutes: 120,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(normalDay.workspaceIsBookable, true);
  assert.equal(normalDay.slots[0]?.startTime, '09:00');
  assert.equal(normalDay.slots[0]?.isAvailable, true);

  const closedDay = await service.listDateAvailability({
    workspaceInstanceId: 'workspace-a1',
    startDate: '2099-08-29',
    endDate: '2099-08-29',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(closedDay.dates[0]?.isAvailable, false);
  assert.equal(closedDay.dates[0]?.reason, 'BUSINESS_CLOSED');

  const overlapRepository = new InMemoryAvailabilityRepository();
  overlapRepository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  overlapRepository.seedWorkspaceInstance({ id: 'workspace-b1', operationalStatus: 'ACTIVE' });
  overlapRepository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '12:00:00' }]);
  overlapRepository.seedBlockingReservation('workspace-b1', {
    reservationId: 'reservation-confirmed',
    reservationStatus: 'CONFIRMED',
    startAt: '2099-08-27T01:00:00.000Z',
    endAt: '2099-08-27T03:00:00.000Z',
  });
  const overlapService = createAvailabilityService(overlapRepository);
  const overlapDay = await overlapService.listTimeAvailability({
    workspaceInstanceId: 'workspace-b1',
    date: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(
    overlapDay.slots.find((slot) => slot.startTime === '09:00')?.blockingReason,
    'RESERVATION_CONFLICT'
  );
  assert.equal(
    overlapDay.slots.find((slot) => slot.startTime === '11:00')?.isAvailable,
    true
  );

  const checkedInRepository = new InMemoryAvailabilityRepository();
  checkedInRepository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  checkedInRepository.seedWorkspaceInstance({ id: 'workspace-c1', operationalStatus: 'ACTIVE' });
  checkedInRepository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '13:00:00' }]);
  checkedInRepository.seedBlockingReservation('workspace-c1', {
    reservationId: 'reservation-checked-in',
    reservationStatus: 'CHECKED_IN',
    startAt: '2099-08-27T02:00:00.000Z',
    endAt: '2099-08-27T04:00:00.000Z',
  });
  const checkedInService = createAvailabilityService(checkedInRepository);
  const checkedInDay = await checkedInService.listTimeAvailability({
    workspaceInstanceId: 'workspace-c1',
    date: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(
    checkedInDay.slots.find((slot) => slot.startTime === '10:00')?.blockingReason,
    'RESERVATION_CONFLICT'
  );

  const blockedRepository = new InMemoryAvailabilityRepository();
  blockedRepository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  blockedRepository.seedWorkspaceInstance({ id: 'workspace-d1', operationalStatus: 'MAINTENANCE' });
  blockedRepository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  const blockedService = createAvailabilityService(blockedRepository);
  const blockedDay = await blockedService.listDateAvailability({
    workspaceInstanceId: 'workspace-d1',
    startDate: '2099-08-27',
    endDate: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(blockedDay.workspaceIsBookable, false);
  assert.equal(blockedDay.dates[0]?.reason, 'WORKSPACE_NOT_BOOKABLE');

  const boundaryRepository = new InMemoryAvailabilityRepository();
  boundaryRepository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  boundaryRepository.seedWorkspaceInstance({ id: 'workspace-e1', operationalStatus: 'ACTIVE' });
  boundaryRepository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '12:00:00' }]);
  boundaryRepository.seedBlockingReservation('workspace-e1', {
    reservationId: 'reservation-boundary',
    reservationStatus: 'CONFIRMED',
    startAt: '2099-08-27T01:00:00.000Z',
    endAt: '2099-08-27T02:00:00.000Z',
  });
  const boundaryService = createAvailabilityService(boundaryRepository);
  const boundaryDay = await boundaryService.listTimeAvailability({
    workspaceInstanceId: 'workspace-e1',
    date: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(
    boundaryDay.slots.find((slot) => slot.startTime === '09:00')?.blockingReason,
    'RESERVATION_CONFLICT'
  );
  assert.equal(
    boundaryDay.slots.find((slot) => slot.startTime === '10:00')?.isAvailable,
    true,
    'back-to-back reservations should remain bookable'
  );

  const closureRepository = new InMemoryAvailabilityRepository();
  closureRepository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  closureRepository.seedWorkspaceInstance({ id: 'workspace-f1', operationalStatus: 'ACTIVE' });
  closureRepository.seedOperatingHours(4, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);
  closureRepository.seedScheduleBlock({
    id: 'business-closure',
    scope: 'BUSINESS',
    workspaceInstanceId: null,
    blockType: 'CLOSURE',
    startAt: '2099-08-27T00:00:00.000Z',
    endAt: '2099-08-27T10:00:00.000Z',
    reason: 'Holiday',
  });
  const closureService = createAvailabilityService(closureRepository);
  const closureDay = await closureService.listDateAvailability({
    workspaceInstanceId: 'workspace-f1',
    startDate: '2099-08-27',
    endDate: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-26T00:00:00.000Z',
  });
  assert.equal(closureDay.dates[0]?.reason, 'BLOCKED');

  const noRemainingTime = await service.listDateAvailability({
    workspaceInstanceId: 'workspace-a1',
    startDate: '2099-08-27',
    endDate: '2099-08-27',
    durationMinutes: 120,
    nowIso: '2099-08-27T08:30:00.000Z',
  });
  assert.equal(noRemainingTime.dates[0]?.reason, 'NO_TIME_REMAINING');

  const timezoneSensitive = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-a1',
    date: '2099-08-27',
    durationMinutes: 60,
    nowIso: '2099-08-27T01:30:00.000Z',
  });
  assert.equal(
    timezoneSensitive.slots.find((slot) => slot.startTime === '09:00')?.blockingReason,
    'PAST_TIME'
  );
  assert.equal(
    timezoneSensitive.slots.find((slot) => slot.startTime === '10:00')?.isAvailable,
    true
  );

  await assert.rejects(
    () =>
      service.listDateAvailability({
        workspaceInstanceId: 'workspace-a1',
        startDate: '2099-08-28',
        endDate: '2099-08-27',
        durationMinutes: 60,
      }),
    (error: unknown) => {
      assert.ok(error instanceof AvailabilityValidationError);
      return true;
    }
  );

  await assert.rejects(
    () =>
      service.listTimeAvailability({
        workspaceInstanceId: 'workspace-a1',
        date: '2099-08-27',
        durationMinutes: 0,
      }),
    (error: unknown) => {
      assert.ok(error instanceof AvailabilityValidationError);
      return true;
    }
  );
}

run()
  .then(() => {
    console.log('M05 availability tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

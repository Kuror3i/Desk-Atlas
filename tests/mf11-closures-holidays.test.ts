import assert from 'node:assert/strict';

import {
  createAdminSettingsService,
  InMemorySettingsRepository,
  createAvailabilityService,
  InMemoryAvailabilityRepository,
  SettingsValidationError,
} from '../packages/domain/src/index';

async function run() {
  console.log('Starting MF-11 closures and holidays tests...');

  // 1. Setup repository and service
  const settingsRepo = new InMemorySettingsRepository();
  const settingsService = createAdminSettingsService(settingsRepo);

  // Setup availability repository for checking booking behavior
  const availabilityRepo = new InMemoryAvailabilityRepository();
  availabilityRepo.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  availabilityRepo.seedWorkspaceInstance({
    id: 'ws-desk-1',
    templateId: 'tpl-1',
    floorId: 'fl-1',
    instanceCode: 'D1',
    displayName: 'Hot Desk 1',
    operationalStatus: 'ACTIVE',
  });
  // Normal weekday hours: 08:00 to 20:00
  for (let day = 0; day <= 6; day++) {
    availabilityRepo.seedOperatingHours(day, [{ opensAt: '08:00:00', closesAt: '20:00:00' }]);
  }
  const availabilityService = createAvailabilityService(availabilityRepo);

  // 2. Initial state: list closures should be empty
  const initialClosures = await settingsService.listClosures();
  assert.equal(initialClosures.length, 0, 'Initial closures should be empty');

  // 3. Test Full-Day Closure
  console.log('Testing full-day closure...');
  const christmasClosure = await settingsService.createClosure({
    date: '2099-12-25',
    closureType: 'FULL_DAY',
    reason: 'Christmas Day',
  });

  assert.equal(christmasClosure.date, '2099-12-25');
  assert.equal(christmasClosure.closureType, 'FULL_DAY');
  assert.equal(christmasClosure.reason, 'Christmas Day');
  assert.equal(christmasClosure.blockIds.length, 1);

  // Verify schedule blocks stored in repository
  const blocks = await settingsRepo.listBusinessScheduleBlocks();
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.scope, 'BUSINESS');
  assert.equal(blocks[0]?.blockType, 'CLOSURE');

  // Seed into availability repo and verify booking availability
  availabilityRepo.seedScheduleBlock(blocks[0]!);

  const dateAvail = await availabilityService.listDateAvailability({
    workspaceInstanceId: 'ws-desk-1',
    startDate: '2099-12-25',
    endDate: '2099-12-25',
    durationMinutes: 60,
    nowIso: '2099-12-01T00:00:00.000Z',
  });
  assert.equal(dateAvail.dates[0]?.isAvailable, false);
  assert.equal(dateAvail.dates[0]?.reason, 'BLOCKED');

  const timeAvail = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'ws-desk-1',
    date: '2099-12-25',
    durationMinutes: 60,
    nowIso: '2099-12-01T00:00:00.000Z',
  });
  assert.ok(timeAvail.slots.length > 0);
  assert.ok(timeAvail.slots.every((s) => !s.isAvailable && s.blockingReason === 'SCHEDULE_BLOCKED'));

  // 4. Test Special Opening Hours (e.g. Christmas Eve open 10:00 - 14:00 only)
  console.log('Testing special opening hours...');
  const eveException = await settingsService.createClosure({
    date: '2099-12-24',
    closureType: 'SPECIAL_HOURS',
    opensAt: '10:00',
    closesAt: '14:00',
    reason: 'Christmas Eve Early Close',
  });

  assert.equal(eveException.date, '2099-12-24');
  assert.equal(eveException.closureType, 'SPECIAL_HOURS');
  assert.equal(eveException.opensAt, '10:00');
  assert.equal(eveException.closesAt, '14:00');
  assert.equal(eveException.blockIds.length, 2, 'Should create 2 blocks (before 10:00 and after 14:00)');

  // Verify listClosures returns both
  const currentClosures = await settingsService.listClosures();
  assert.equal(currentClosures.length, 2);
  const foundEve = currentClosures.find((c) => c.date === '2099-12-24');
  assert.ok(foundEve);
  assert.equal(foundEve?.closureType, 'SPECIAL_HOURS');
  assert.equal(foundEve?.opensAt, '10:00');
  assert.equal(foundEve?.closesAt, '14:00');

  // Seed both blocks into availability repo and verify special hours availability
  const allBlocks = await settingsRepo.listBusinessScheduleBlocks();
  for (const b of allBlocks) {
    availabilityRepo.seedScheduleBlock(b);
  }

  const eveTimeAvail = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'ws-desk-1',
    date: '2099-12-24',
    durationMinutes: 60,
    nowIso: '2099-12-01T00:00:00.000Z',
  });

  // Slots before 10:00 should be SCHEDULE_BLOCKED
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '08:00')?.isAvailable, false);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '08:00')?.blockingReason, 'SCHEDULE_BLOCKED');
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '09:00')?.isAvailable, false);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '09:00')?.blockingReason, 'SCHEDULE_BLOCKED');

  // Slots between 10:00 and 14:00 should be AVAILABLE
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '10:00')?.isAvailable, true);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '11:00')?.isAvailable, true);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '12:00')?.isAvailable, true);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '13:00')?.isAvailable, true);

  // Slots at or after 14:00 should be SCHEDULE_BLOCKED
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '14:00')?.isAvailable, false);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '14:00')?.blockingReason, 'SCHEDULE_BLOCKED');
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '15:00')?.isAvailable, false);
  assert.equal(eveTimeAvail.slots.find((s) => s.startTime === '15:00')?.blockingReason, 'SCHEDULE_BLOCKED');

  // 5. Test Multi-day Full Closure
  console.log('Testing multi-day closure...');
  const newYearBreak = await settingsService.createClosure({
    date: '2099-12-30',
    endDate: '2099-12-31',
    closureType: 'FULL_DAY',
    reason: 'Year-End Maintenance',
  });
  assert.equal(newYearBreak.date, '2099-12-30');
  assert.equal(newYearBreak.endDate, '2099-12-31');

  const afterMultiDayClosures = await settingsService.listClosures();
  assert.equal(afterMultiDayClosures.length, 3);
  const foundBreak = afterMultiDayClosures.find((c) => c.date === '2099-12-30');
  assert.ok(foundBreak);
  assert.equal(foundBreak?.endDate, '2099-12-31');

  // 6. Test Overlap Replacement / Normalization
  console.log('Testing overlap replacement...');
  // Replace 2099-12-25 full day closure with a special hours exception (12:00 - 18:00)
  const modifiedChristmas = await settingsService.createClosure({
    date: '2099-12-25',
    closureType: 'SPECIAL_HOURS',
    opensAt: '12:00',
    closesAt: '18:00',
    reason: 'Christmas Afternoon Open',
  });
  assert.equal(modifiedChristmas.closureType, 'SPECIAL_HOURS');
  assert.equal(modifiedChristmas.opensAt, '12:00');
  assert.equal(modifiedChristmas.closesAt, '18:00');

  const updatedClosuresList = await settingsService.listClosures();
  const christmasInList = updatedClosuresList.find((c) => c.date === '2099-12-25');
  assert.equal(christmasInList?.closureType, 'SPECIAL_HOURS');
  assert.equal(christmasInList?.opensAt, '12:00');
  assert.equal(christmasInList?.closesAt, '18:00');

  // 7. Test Deletion of Closure
  console.log('Testing closure deletion...');
  await settingsService.deleteClosure(christmasInList!.blockIds);
  const afterDeleteClosures = await settingsService.listClosures();
  assert.equal(afterDeleteClosures.find((c) => c.date === '2099-12-25'), undefined);

  // 8. Test Validation Errors
  console.log('Testing validation errors...');
  await assert.rejects(
    () =>
      settingsService.createClosure({
        date: 'invalid-date',
        closureType: 'FULL_DAY',
      }),
    (err: unknown) => {
      assert.ok(err instanceof SettingsValidationError);
      return true;
    }
  );

  await assert.rejects(
    () =>
      settingsService.createClosure({
        date: '2099-12-25',
        closureType: 'SPECIAL_HOURS',
        opensAt: '16:00',
        closesAt: '10:00', // Inverted times
      }),
    (err: unknown) => {
      assert.ok(err instanceof SettingsValidationError);
      return true;
    }
  );

  await assert.rejects(
    () =>
      settingsService.createClosure({
        date: '2099-12-25',
        endDate: '2099-12-20', // End date before start date
        closureType: 'FULL_DAY',
      }),
    (err: unknown) => {
      assert.ok(err instanceof SettingsValidationError);
      return true;
    }
  );

  console.log('All MF-11 closures and holidays tests passed successfully!');
}

run().catch((error) => {
  console.error('MF-11 test failure:', error);
  process.exit(1);
});

import assert from 'node:assert/strict';
import {
  AvailabilityValidationError,
  InMemoryAvailabilityRepository,
  createAvailabilityService,
} from '../packages/domain/src/index';

async function run() {
  console.log('--- Starting MF-20 Customer Calendar, Duration & Time Tests ---');

  const repository = new InMemoryAvailabilityRepository();
  repository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });

  repository.seedWorkspaceInstance({
    id: 'workspace-main-1',
    templateId: 'template-dedicated-desk',
    floorId: 'floor-1',
    instanceCode: 'D101',
    displayName: 'Dedicated Desk 101',
    operationalStatus: 'ACTIVE',
  });

  // Operating hours: Mon-Fri 08:00 to 18:00 (8 AM to 6 PM)
  for (let day = 1; day <= 5; day++) {
    repository.seedOperatingHours(day, [{ opensAt: '08:00:00', closesAt: '18:00:00' }]);
  }

  const service = createAvailabilityService(repository);

  // 1. Overlap blocking with duration (the 4-hour, 11:00 AM reservation example in MF-20)
  // Reservation exists on 2099-09-01 (Tuesday) from 11:00 AM to 12:00 PM Manila time (03:00 to 04:00 UTC)
  repository.seedBlockingReservation('workspace-main-1', {
    reservationId: 'res-confirmed-11am',
    reservationStatus: 'CONFIRMED',
    startAt: '2099-09-01T03:00:00.000Z', // 11:00 AM Manila
    endAt: '2099-09-01T04:00:00.000Z',   // 12:00 PM Manila
  });

  console.log('Testing 4-hour duration availability when 11:00 AM is reserved...');
  const fourHourSlots = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-main-1',
    date: '2099-09-01',
    durationMinutes: 240, // 4 hours
    nowIso: '2099-08-31T00:00:00.000Z',
  });

  // Start 08:00 (08:00 - 12:00) overlaps 11:00-12:00 -> blocked
  const slot08 = fourHourSlots.slots.find((s) => s.startTime === '08:00');
  assert.ok(slot08, 'Slot 08:00 should exist');
  assert.equal(slot08.endTime, '12:00');
  assert.equal(slot08.isAvailable, false, '08:00 start should be disabled for 4h booking');
  assert.equal(slot08.blockingReason, 'RESERVATION_CONFLICT');

  // Start 09:00 (09:00 - 13:00) overlaps 11:00-12:00 -> blocked
  const slot09 = fourHourSlots.slots.find((s) => s.startTime === '09:00');
  assert.ok(slot09, 'Slot 09:00 should exist');
  assert.equal(slot09.endTime, '13:00');
  assert.equal(slot09.isAvailable, false, '09:00 start should be disabled for 4h booking');
  assert.equal(slot09.blockingReason, 'RESERVATION_CONFLICT');

  // Start 10:00 (10:00 - 14:00) overlaps 11:00-12:00 -> blocked
  const slot10 = fourHourSlots.slots.find((s) => s.startTime === '10:00');
  assert.ok(slot10, 'Slot 10:00 should exist');
  assert.equal(slot10.endTime, '14:00');
  assert.equal(slot10.isAvailable, false, '10:00 start should be disabled for 4h booking');
  assert.equal(slot10.blockingReason, 'RESERVATION_CONFLICT');

  // Start 11:00 (11:00 - 15:00) starts on 11:00 -> blocked
  const slot11 = fourHourSlots.slots.find((s) => s.startTime === '11:00');
  assert.ok(slot11, 'Slot 11:00 should exist');
  assert.equal(slot11.endTime, '15:00');
  assert.equal(slot11.isAvailable, false, '11:00 start should be disabled for 4h booking');
  assert.equal(slot11.blockingReason, 'RESERVATION_CONFLICT');

  // Start 12:00 (12:00 - 16:00) starts exactly when reservation ends (12:00) -> available!
  const slot12 = fourHourSlots.slots.find((s) => s.startTime === '12:00');
  assert.ok(slot12, 'Slot 12:00 should exist');
  assert.equal(slot12.endTime, '16:00');
  assert.equal(slot12.isAvailable, true, '12:00 start should be available (back-to-back)');
  assert.equal(slot12.blockingReason, null);

  // Start 13:00 (13:00 - 17:00) -> available!
  const slot13 = fourHourSlots.slots.find((s) => s.startTime === '13:00');
  assert.ok(slot13, 'Slot 13:00 should exist');
  assert.equal(slot13.endTime, '17:00');
  assert.equal(slot13.isAvailable, true);

  // Start 14:00 (14:00 - 18:00) -> available!
  const slot14 = fourHourSlots.slots.find((s) => s.startTime === '14:00');
  assert.ok(slot14, 'Slot 14:00 should exist');
  assert.equal(slot14.endTime, '18:00');
  assert.equal(slot14.isAvailable, true);

  // Start 15:00 would end at 19:00 (beyond 18:00 close), so it must not be generated
  const slot15 = fourHourSlots.slots.find((s) => s.startTime === '15:00');
  assert.equal(slot15, undefined, '15:00 start should not exist because 15:00+4h exceeds closing time');

  console.log('[PASS] 4-hour duration availability correctly disables overlapping start times');

  // 2. Testing 1-hour duration on the same day: only 11:00 should be blocked
  console.log('Testing 1-hour duration on same day...');
  const oneHourSlots = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-main-1',
    date: '2099-09-01',
    durationMinutes: 60,
    nowIso: '2099-08-31T00:00:00.000Z',
  });

  const oneHr08 = oneHourSlots.slots.find((s) => s.startTime === '08:00');
  assert.equal(oneHr08?.isAvailable, true, '08:00 for 1h is available');
  const oneHr10 = oneHourSlots.slots.find((s) => s.startTime === '10:00');
  assert.equal(oneHr10?.isAvailable, true, '10:00 for 1h is available (ends at 11:00)');
  const oneHr11 = oneHourSlots.slots.find((s) => s.startTime === '11:00');
  assert.equal(oneHr11?.isAvailable, false, '11:00 for 1h is blocked');
  const oneHr12 = oneHourSlots.slots.find((s) => s.startTime === '12:00');
  assert.equal(oneHr12?.isAvailable, true, '12:00 for 1h is available');

  console.log('[PASS] 1-hour duration calculates exact non-overlapping boundaries');

  // 3. Testing CHECKED_IN reservation state also blocks
  console.log('Testing CHECKED_IN reservation status blocking...');
  repository.seedBlockingReservation('workspace-main-1', {
    reservationId: 'res-checked-in-2pm',
    reservationStatus: 'CHECKED_IN',
    startAt: '2099-09-01T06:00:00.000Z', // 14:00 Manila (2 PM)
    endAt: '2099-09-01T08:00:00.000Z',   // 16:00 Manila (4 PM)
  });

  const checkedInCheck = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-main-1',
    date: '2099-09-01',
    durationMinutes: 120, // 2 hours
    nowIso: '2099-08-31T00:00:00.000Z',
  });

  const slot13_2hr = checkedInCheck.slots.find((s) => s.startTime === '13:00'); // 13:00 - 15:00 overlaps 14:00-16:00
  assert.equal(slot13_2hr?.isAvailable, false);
  assert.equal(slot13_2hr?.blockingReason, 'RESERVATION_CONFLICT');

  const slot14_2hr = checkedInCheck.slots.find((s) => s.startTime === '14:00'); // 14:00 - 16:00 exactly overlaps
  assert.equal(slot14_2hr?.isAvailable, false);

  const slot16_2hr = checkedInCheck.slots.find((s) => s.startTime === '16:00'); // 16:00 - 18:00 back-to-back
  assert.equal(slot16_2hr?.isAvailable, true);

  console.log('[PASS] CHECKED_IN reservation blocks overlapping time slots');

  // 4. Past time blocking
  console.log('Testing past time slot blocking...');
  const pastCheck = await service.listTimeAvailability({
    workspaceInstanceId: 'workspace-main-1',
    date: '2099-09-01',
    durationMinutes: 60,
    nowIso: '2099-09-01T01:30:00.000Z', // 09:30 AM Manila on 2099-09-01
  });

  const pastSlot08 = pastCheck.slots.find((s) => s.startTime === '08:00');
  assert.equal(pastSlot08?.isAvailable, false);
  assert.equal(pastSlot08?.blockingReason, 'PAST_TIME');

  const pastSlot09 = pastCheck.slots.find((s) => s.startTime === '09:00');
  assert.equal(pastSlot09?.isAvailable, false);
  assert.equal(pastSlot09?.blockingReason, 'PAST_TIME');

  const futureSlot10 = pastCheck.slots.find((s) => s.startTime === '10:00');
  assert.equal(futureSlot10?.isAvailable, true);

  console.log('[PASS] Past time slots correctly marked as PAST_TIME');

  // 5. Calendar date availability & closed days
  console.log('Testing date range availability...');
  const dateRange = await service.listDateAvailability({
    workspaceInstanceId: 'workspace-main-1',
    startDate: '2099-08-31', // Monday (Open)
    endDate: '2099-09-06',   // Sunday (Closed on Sat/Sun)
    durationMinutes: 120,
    nowIso: '2099-08-30T00:00:00.000Z',
  });

  const mon = dateRange.dates.find((d) => d.date === '2099-08-31');
  assert.equal(mon?.isAvailable, true);
  assert.equal(mon?.reason, 'AVAILABLE');

  const sat = dateRange.dates.find((d) => d.date === '2099-09-05');
  assert.equal(sat?.isAvailable, false);
  assert.equal(sat?.reason, 'BUSINESS_CLOSED');

  const sun = dateRange.dates.find((d) => d.date === '2099-09-06');
  assert.equal(sun?.isAvailable, false);
  assert.equal(sun?.reason, 'BUSINESS_CLOSED');

  console.log('[PASS] Calendar date availability reflects open/closed days correctly');

  console.log('--- All MF-20 Tests Passed Successfully! ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

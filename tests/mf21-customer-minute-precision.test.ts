import assert from 'node:assert/strict';
import {
  AvailabilityValidationError,
  CandidateValidationError,
  InMemoryAvailabilityRepository,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createAvailabilityService,
  createPaymentSessionService,
  createReservationService,
  validateCandidates,
  type CandidateSubmissionDTO,
  type CandidateValidationContext,
} from '../packages/domain/src/index';

async function run() {
  console.log('--- Starting MF-21 Customer Minute-Precision Booking Tests ---');

  const repository = new InMemoryAvailabilityRepository();
  repository.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });

  repository.seedWorkspaceInstance({
    id: 'workspace-mf21-1',
    templateId: 'template-desk-std',
    floorId: 'floor-1',
    instanceCode: 'D201',
    displayName: 'Dedicated Desk 201',
    operationalStatus: 'ACTIVE',
  });

  repository.seedWorkspaceInstance({
    id: 'workspace-mf21-2',
    templateId: 'template-desk-std',
    floorId: 'floor-1',
    instanceCode: 'D202',
    displayName: 'Dedicated Desk 202',
    operationalStatus: 'ACTIVE',
  });

  repository.seedWorkspaceInstance({
    id: 'workspace-mf21-3',
    templateId: 'template-desk-std',
    floorId: 'floor-1',
    instanceCode: 'D203',
    displayName: 'Dedicated Desk 203',
    operationalStatus: 'ACTIVE',
  });

  // Operating hours: Mon-Fri 08:00 to 18:00 (8:00 AM to 6:00 PM Manila time)
  for (let day = 1; day <= 5; day++) {
    repository.seedOperatingHours(day, [{ opensAt: '08:00:00', closesAt: '18:00:00' }]);
  }

  const availabilityService = createAvailabilityService(repository);

  // 1. Acceptance Criterion: 9:10 AM to 10:10 AM is accepted when business hours allow it and no overlap exists
  console.log('Testing 9:10 AM to 10:10 AM (1 hour) availability...');
  const slot910 = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01', // Tuesday
    durationMinutes: 60,
    customStartTime: '09:10',
    nowIso: '2099-08-31T00:00:00.000Z',
  });

  const found910 = slot910.slots.find((s) => s.startTime === '09:10');
  assert.ok(found910, 'Slot 09:10 should exist in slots');
  assert.equal(found910.endTime, '10:10', 'End time for 60 min from 09:10 should be 10:10');
  assert.equal(found910.isAvailable, true, '09:10–10:10 slot should be available');
  assert.equal(found910.blockingReason, null);
  console.log('[PASS] 9:10 AM to 10:10 AM is available without overlap');

  // 2. Acceptance Criterion: 10:15 AM to 12:15 PM is accepted when business hours allow it and no overlap exists
  console.log('Testing 10:15 AM to 12:15 PM (2 hours) availability...');
  const slot1015 = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 120,
    customStartTime: '10:15',
    nowIso: '2099-08-31T00:00:00.000Z',
  });

  const found1015 = slot1015.slots.find((s) => s.startTime === '10:15');
  assert.ok(found1015, 'Slot 10:15 should exist');
  assert.equal(found1015.endTime, '12:15', 'End time for 120 min from 10:15 should be 12:15');
  assert.equal(found1015.isAvailable, true, '10:15–12:15 slot should be available');
  assert.equal(found1015.blockingReason, null);
  console.log('[PASS] 10:15 AM to 12:15 PM is available without overlap');

  // 3. Seed an existing reservation from 10:00 AM to 11:30 AM Manila time (02:00 to 03:30 UTC)
  // Range: 2099-09-01 10:00 to 11:30
  repository.seedBlockingReservation('workspace-mf21-1', {
    reservationId: 'res-existing-10am-1130am',
    reservationStatus: 'CONFIRMED',
    startAt: '2099-09-01T02:00:00.000Z', // 10:00 AM Manila
    endAt: '2099-09-01T03:30:00.000Z',   // 11:30 AM Manila
  });

  // 4. Overlap check: 09:10 to 10:10 overlaps 10:00 to 11:30
  console.log('Testing overlap detection for 09:10 to 10:10 (overlaps 10:00–11:30)...');
  const overlapCheck1 = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '09:10',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const overlapSlot1 = overlapCheck1.slots.find((s) => s.startTime === '09:10');
  assert.ok(overlapSlot1);
  assert.equal(overlapSlot1.isAvailable, false, '09:10–10:10 must be blocked due to overlap');
  assert.equal(overlapSlot1.blockingReason, 'RESERVATION_CONFLICT');
  console.log('[PASS] 09:10–10:10 overlapping reservation is blocked with RESERVATION_CONFLICT');

  // 5. Overlap check: 11:00 to 12:00 overlaps 10:00 to 11:30
  console.log('Testing overlap detection for 11:00 to 12:00...');
  const overlapCheck2 = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '11:00',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const overlapSlot2 = overlapCheck2.slots.find((s) => s.startTime === '11:00');
  assert.ok(overlapSlot2);
  assert.equal(overlapSlot2.isAvailable, false);
  assert.equal(overlapSlot2.blockingReason, 'RESERVATION_CONFLICT');
  console.log('[PASS] 11:00–12:00 overlapping reservation is blocked');

  // 6. Back-to-back boundary checks:
  // A booking ending exactly when existing reservation starts (09:00 to 10:00 vs 10:00 to 11:30) is allowed!
  console.log('Testing back-to-back: booking ending exactly at 10:00...');
  const backToBackBefore = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '09:00',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const slot0900 = backToBackBefore.slots.find((s) => s.startTime === '09:00');
  assert.ok(slot0900);
  assert.equal(slot0900.endTime, '10:00');
  assert.equal(slot0900.isAvailable, true, '09:00–10:00 ending at 10:00 should be allowed');
  assert.equal(slot0900.blockingReason, null);
  console.log('[PASS] Back-to-back ending exactly when reservation starts is allowed');

  // A booking starting exactly when existing reservation ends (11:30 to 12:30 vs 10:00 to 11:30) is allowed!
  console.log('Testing back-to-back: booking starting exactly at 11:30...');
  const backToBackAfter = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '11:30',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const slot1130 = backToBackAfter.slots.find((s) => s.startTime === '11:30');
  assert.ok(slot1130);
  assert.equal(slot1130.endTime, '12:30');
  assert.equal(slot1130.isAvailable, true, '11:30–12:30 starting at 11:30 should be allowed');
  assert.equal(slot1130.blockingReason, null);
  console.log('[PASS] Back-to-back starting exactly when reservation ends is allowed');

  // 7. Operating hours boundary checks:
  // Operating hours are 08:00 to 18:00.
  // 07:45 start time (ends 08:45) is before opening time -> BUSINESS_CLOSED
  console.log('Testing custom start time outside business operating hours...');
  const earlyCheck = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '07:45',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const earlySlot = earlyCheck.slots.find((s) => s.startTime === '07:45');
  assert.ok(earlySlot);
  assert.equal(earlySlot.isAvailable, false);
  assert.equal(earlySlot.blockingReason, 'BUSINESS_CLOSED');

  // 17:15 start time with 60 min duration ends at 18:15 (after 18:00 close) -> BUSINESS_CLOSED
  const lateCheck = await availabilityService.listTimeAvailability({
    workspaceInstanceId: 'workspace-mf21-1',
    date: '2099-09-01',
    durationMinutes: 60,
    customStartTime: '17:15',
    nowIso: '2099-08-31T00:00:00.000Z',
  });
  const lateSlot = lateCheck.slots.find((s) => s.startTime === '17:15');
  assert.ok(lateSlot);
  assert.equal(lateSlot.isAvailable, false);
  assert.equal(lateSlot.blockingReason, 'BUSINESS_CLOSED');
  console.log('[PASS] Out-of-bounds start times correctly blocked with BUSINESS_CLOSED');

  // 8. Candidate Validation with minute precision
  console.log('Testing candidate validation with minute precision...');
  const validationContext: CandidateValidationContext = {
    instances: [
      {
        id: 'inst-std-1',
        templateId: 'tpl-std',
        floorId: 'fl-1',
        instanceCode: 'D1',
        displayName: 'Desk 1',
        operationalStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'inst-std-2',
        templateId: 'tpl-std',
        floorId: 'fl-1',
        instanceCode: 'D2',
        displayName: 'Desk 2',
        operationalStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'inst-std-3',
        templateId: 'tpl-std',
        floorId: 'fl-1',
        instanceCode: 'D3',
        displayName: 'Desk 3',
        operationalStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    templates: [
      {
        id: 'tpl-std',
        name: 'Standard Desk',
        description: null,
        photoPath: null,
        capacity: 1,
        rateAmount: 50.0,
        pricingUnit: 'HOURLY',
        defaultShape: 'rect',
        defaultColor: '#FFF',
        defaultStyle: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  // Main at 09:10–10:10 (1 hr), Alt 1 at 10:15–11:15 (1 hr), Alt 2 at 13:45–14:45 (1 hr)
  const minuteCandidates: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: 'inst-std-1',
      startAt: '2026-09-01T01:10:00.000Z', // 09:10 AM Manila
      endAt: '2026-09-01T02:10:00.000Z',   // 10:10 AM Manila (1h)
    },
    {
      rank: 1,
      workspaceInstanceId: 'inst-std-2',
      startAt: '2026-09-01T02:15:00.000Z', // 10:15 AM Manila
      endAt: '2026-09-01T03:15:00.000Z',   // 11:15 AM Manila (1h)
    },
    {
      rank: 2,
      workspaceInstanceId: 'inst-std-3',
      startAt: '2026-09-01T05:45:00.000Z', // 13:45 Manila (1:45 PM)
      endAt: '2026-09-01T06:45:00.000Z',   // 14:45 Manila (2:45 PM) (1h)
    },
  ];

  validateCandidates(minuteCandidates, validationContext);
  console.log('[PASS] Validated minute-precision Main + Alt1 + Alt2 with same date and duration');

  // Reject candidate with duration mismatch (e.g. 75 min vs 60 min)
  assert.throws(
    () => {
      const invalidDurationCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: 'inst-std-1',
          startAt: '2026-09-01T01:10:00.000Z',
          endAt: '2026-09-01T02:10:00.000Z', // 60 min
        },
        {
          rank: 1,
          workspaceInstanceId: 'inst-std-2',
          startAt: '2026-09-01T02:15:00.000Z',
          endAt: '2026-09-01T03:30:00.000Z', // 75 min (duration mismatch)
        },
      ];
      validateCandidates(invalidDurationCandidates, validationContext);
    },
    (err: any) => err instanceof CandidateValidationError && err.message.includes('same duration')
  );
  console.log('[PASS] Rejects alternative candidate with mismatched duration');

  // 9. Full Reservation Creation with Minute Precision
  console.log('Testing full reservation creation with minute-precise start/end time...');
  const resRepo = new ReservationMemoryRepository();
  const wsRepo = new InMemoryWorkspaceRepository();
  const paySessionSvc = createPaymentSessionService(resRepo);
  const resService = createReservationService(resRepo, wsRepo, resRepo, paySessionSvc);

  const floor = await wsRepo.createFloor({ name: 'Floor 1' });
  const tpl = await wsRepo.createTemplate({
    name: 'Standard Desk',
    capacity: 1,
    rateAmount: 80,
    pricingUnit: 'HOURLY',
    defaultShape: 'rectangle',
    defaultColor: '#000000',
    isActive: true,
  });
  const inst1 = await wsRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: 'M1',
    displayName: 'Minute Desk 1',
  });
  const inst2 = await wsRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: 'M2',
    displayName: 'Minute Desk 2',
  });

  const webReservation = await resService.createReservation(
    {
      source: 'WEB',
      customerFirstName: 'Maria',
      customerLastName: 'Santos',
      customerEmail: 'maria.santos@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: inst1.id,
          startAt: '2027-03-15T01:10:00.000Z', // 9:10 AM Manila
          endAt: '2027-03-15T03:10:00.000Z',   // 11:10 AM Manila (2 hours)
        },
        {
          rank: 1,
          workspaceInstanceId: inst2.id,
          startAt: '2027-03-15T02:15:00.000Z', // 10:15 AM Manila
          endAt: '2027-03-15T04:15:00.000Z',   // 12:15 PM Manila (2 hours)
        },
      ],
    },
    { paymentLinkBaseUrl: 'https://deskatlas.test/pay' }
  );

  assert.ok(webReservation.id);
  assert.equal(webReservation.rateSnapshot, 80);
  assert.equal(webReservation.amountDue, 160, '2 hours at 80/hr = 160');
  assert.equal(webReservation.candidates?.length, 2);
  assert.equal(webReservation.candidates[0].startAt, '2027-03-15T01:10:00.000Z');
  assert.equal(webReservation.candidates[0].endAt, '2027-03-15T03:10:00.000Z');
  assert.equal(webReservation.candidates[1].startAt, '2027-03-15T02:15:00.000Z');
  assert.equal(webReservation.candidates[1].endAt, '2027-03-15T04:15:00.000Z');
  console.log('[PASS] Full reservation creation preserves minute-precision timestamps & amounts');

  console.log('--- All MF-21 Tests Passed Successfully! ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

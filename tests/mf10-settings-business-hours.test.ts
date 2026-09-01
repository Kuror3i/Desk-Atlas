import assert from 'node:assert/strict';

import {
  InMemorySettingsRepository,
  createAdminSettingsService,
  SettingsValidationError,
  InMemoryAvailabilityRepository,
  createAvailabilityService,
} from '../packages/domain/src/index';

async function run() {
  console.log('--- Starting MF-10 Settings, Business Hours & Payment Methods Tests ---');

  const repository = new InMemorySettingsRepository();
  const service = createAdminSettingsService(repository);

  // 1. Initial Overview Load
  const overview = await service.getSettingsOverview();
  assert.ok(overview.businessSettings, 'businessSettings should be present');
  assert.equal(overview.businessSettings.businessName, 'DeskAtlas Coworking');
  assert.ok(overview.operatingHoursConfig, 'operatingHoursConfig should be present');
  assert.ok(Array.isArray(overview.paymentMethods), 'paymentMethods should be an array');
  assert.ok(overview.paymentMethods.length >= 3, 'should load initial payment methods');
  console.log('[PASS] Settings overview initial load');

  // 2. Update Business Profile
  const updatedProfile = await service.updateBusinessSettings({
    businessName: 'DeskAtlas Global HQ',
    timezone: 'Asia/Manila',
    contactEmail: 'admin@deskatlas.ph',
    contactPhone: '+63 2 8123 4567',
    bookingIntervalMinutes: 60,
    paymentExpiryMinutes: 45,
    kioskTimeoutMinutes: 3,
  });
  assert.equal(updatedProfile.businessName, 'DeskAtlas Global HQ');
  assert.equal(updatedProfile.bookingIntervalMinutes, 60);
  assert.equal(updatedProfile.paymentExpiryMinutes, 45);
  assert.equal(updatedProfile.kioskTimeoutMinutes, 3);
  console.log('[PASS] Update business profile settings');

  // 3. Validation: Reject Invalid Business Profile Inputs
  await assert.rejects(
    () =>
      service.updateBusinessSettings({
        businessName: '',
        timezone: 'Asia/Manila',
        bookingIntervalMinutes: 60,
        paymentExpiryMinutes: 60,
      }),
    (err) => err instanceof SettingsValidationError,
    'Should reject empty business name'
  );

  await assert.rejects(
    () =>
      service.updateBusinessSettings({
        businessName: 'DeskAtlas',
        timezone: 'Invalid/Timezone_Name_123',
        bookingIntervalMinutes: 60,
        paymentExpiryMinutes: 60,
      }),
    (err) => err instanceof SettingsValidationError,
    'Should reject invalid IANA timezone'
  );

  await assert.rejects(
    () =>
      service.updateBusinessSettings({
        businessName: 'DeskAtlas',
        timezone: 'Asia/Manila',
        bookingIntervalMinutes: 0,
        paymentExpiryMinutes: 60,
      }),
    (err) => err instanceof SettingsValidationError,
    'Should reject non-positive booking interval'
  );
  console.log('[PASS] Business profile validation rules');

  // 4. Adaptable Operating Hours: 24/7 Mode
  const hours247 = await service.updateOperatingHours({
    mode: '24_7',
    schedules: [],
  });
  assert.equal(hours247.mode, '24_7');
  assert.equal(hours247.schedules.length, 7);
  assert.ok(hours247.schedules.every((s) => s.isOpen && s.is24Hours));
  console.log('[PASS] Operating hours 24/7 mode');

  // 5. Adaptable Operating Hours: 24 Hours on Selected Days (e.g. Mon-Fri open 24h, Sat-Sun closed)
  const selected24h = await service.updateOperatingHours({
    mode: '24_HOURS_SELECTED_DAYS',
    schedules: [
      { dayOfWeek: 0, isOpen: false }, // Sun closed
      { dayOfWeek: 1, isOpen: true },  // Mon open 24h
      { dayOfWeek: 2, isOpen: true },  // Tue open 24h
      { dayOfWeek: 3, isOpen: true },  // Wed open 24h
      { dayOfWeek: 4, isOpen: true },  // Thu open 24h
      { dayOfWeek: 5, isOpen: true },  // Fri open 24h
      { dayOfWeek: 6, isOpen: false }, // Sat closed
    ],
  });
  assert.equal(selected24h.mode, '24_HOURS_SELECTED_DAYS');
  const sun = selected24h.schedules.find((s) => s.dayOfWeek === 0);
  const mon = selected24h.schedules.find((s) => s.dayOfWeek === 1);
  assert.equal(sun?.isOpen, false);
  assert.equal(mon?.isOpen, true);
  assert.equal(mon?.is24Hours, true);
  console.log('[PASS] Operating hours 24h on selected days mode');

  // 6. Adaptable Operating Hours: Custom Hours
  const customHours = await service.updateOperatingHours({
    mode: 'CUSTOM_HOURS',
    schedules: [
      { dayOfWeek: 0, isOpen: false },
      {
        dayOfWeek: 1,
        isOpen: true,
        is24Hours: false,
        intervals: [{ opensAt: '08:00', closesAt: '20:00' }],
      },
      {
        dayOfWeek: 2,
        isOpen: true,
        is24Hours: false,
        intervals: [{ opensAt: '08:00', closesAt: '20:00' }],
      },
      {
        dayOfWeek: 3,
        isOpen: true,
        is24Hours: false,
        intervals: [{ opensAt: '08:00', closesAt: '20:00' }],
      },
      {
        dayOfWeek: 4,
        isOpen: true,
        is24Hours: false,
        intervals: [{ opensAt: '08:00', closesAt: '20:00' }],
      },
      {
        dayOfWeek: 5,
        isOpen: true,
        is24Hours: false,
        intervals: [{ opensAt: '08:00', closesAt: '20:00' }],
      },
      { dayOfWeek: 6, isOpen: false },
    ],
  });
  assert.equal(customHours.mode, 'CUSTOM_HOURS');
  const customMon = customHours.schedules.find((s) => s.dayOfWeek === 1);
  assert.equal(customMon?.isOpen, true);
  assert.equal(customMon?.is24Hours, false);
  assert.equal(customMon?.intervals[0]?.opensAt, '08:00');
  assert.equal(customMon?.intervals[0]?.closesAt, '20:00');
  console.log('[PASS] Operating hours custom hours mode');

  // 7. Validation: Reject Invalid Operating Hours Intervals
  await assert.rejects(
    () =>
      service.updateOperatingHours({
        mode: 'CUSTOM_HOURS',
        schedules: [
          {
            dayOfWeek: 1,
            isOpen: true,
            is24Hours: false,
            intervals: [{ opensAt: '18:00', closesAt: '09:00' }], // Closes before opens
          },
        ],
      }),
    (err) => err instanceof SettingsValidationError,
    'Should reject interval where opensAt >= closesAt'
  );

  await assert.rejects(
    () =>
      service.updateOperatingHours({
        mode: 'CUSTOM_HOURS',
        schedules: [
          {
            dayOfWeek: 1,
            isOpen: true,
            is24Hours: false,
            intervals: [{ opensAt: '10:00', closesAt: '10:00' }], // Identical times
          },
        ],
      }),
    (err) => err instanceof SettingsValidationError,
    'Should reject interval with equal open and close time'
  );
  console.log('[PASS] Operating hours validation rules');

  // 8. Payment Method Updates & Invariants
  const updatedGcash = await service.updatePaymentMethod({
    id: 'pm-gcash',
    displayName: 'GCash Merchant QR',
    accountName: 'DeskAtlas PH Inc',
    accountNumber: '09179998888',
    qrImagePath: '/storage/v1/gcash.png',
    instructions: 'Scan QR and submit proof',
    allowWeb: true,
    allowKiosk: true,
    isActive: true,
  });
  assert.equal(updatedGcash.displayName, 'GCash Merchant QR');
  assert.equal(updatedGcash.accountNumber, '09179998888');
  assert.equal(updatedGcash.allowKiosk, true);
  console.log('[PASS] Update payment method');

  // 9. Availability Engine Integration with 24/7 Operating Hours
  const availRepo = new InMemoryAvailabilityRepository();
  availRepo.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  availRepo.seedWorkspaceInstance({
    id: 'desk-247',
    displayName: '24/7 Hot Desk',
    operationalStatus: 'ACTIVE',
  });
  // Seed all 7 days with full 24h intervals (00:00:00 to 24:00:00)
  for (let d = 0; d <= 6; d++) {
    availRepo.seedOperatingHours(d, [{ opensAt: '00:00:00', closesAt: '24:00:00' }]);
  }

  const availService = createAvailabilityService(availRepo);
  const availResult = await availService.listTimeAvailability({
    workspaceInstanceId: 'desk-247',
    date: '2099-10-15',
    durationMinutes: 60,
    nowIso: '2099-10-14T00:00:00.000Z',
  });

  assert.equal(availResult.workspaceIsBookable, true);
  assert.equal(availResult.slots.length, 24, '24/7 should yield 24 hourly slots');
  assert.equal(availResult.slots[0]?.startTime, '00:00');
  assert.equal(availResult.slots[0]?.endTime, '01:00');
  assert.equal(availResult.slots[23]?.startTime, '23:00');
  assert.equal(availResult.slots[23]?.endTime, '24:00');
  assert.ok(availResult.slots.every((s) => s.isAvailable));
  console.log('[PASS] Availability engine 24/7 integration');

  // 10. Availability Engine Integration with Selected-Day Closed Status
  const closedAvailRepo = new InMemoryAvailabilityRepository();
  closedAvailRepo.setBusinessSettings({
    timezone: 'Asia/Manila',
    bookingIntervalMinutes: 60,
  });
  closedAvailRepo.seedWorkspaceInstance({
    id: 'desk-weekday-only',
    displayName: 'Weekday Desk',
    operationalStatus: 'ACTIVE',
  });
  // Monday only
  closedAvailRepo.seedOperatingHours(1, [{ opensAt: '09:00:00', closesAt: '17:00:00' }]);

  const closedAvailService = createAvailabilityService(closedAvailRepo);
  // Sunday query (2099-10-18 is Sunday)
  const sundayResult = await closedAvailService.listDateAvailability({
    workspaceInstanceId: 'desk-weekday-only',
    startDate: '2099-10-18',
    endDate: '2099-10-18',
    durationMinutes: 60,
    nowIso: '2099-10-14T00:00:00.000Z',
  });
  assert.equal(sundayResult.dates[0]?.isAvailable, false);
  assert.equal(sundayResult.dates[0]?.reason, 'BUSINESS_CLOSED');

  // Monday query (2099-10-19 is Monday)
  const mondayResult = await closedAvailService.listDateAvailability({
    workspaceInstanceId: 'desk-weekday-only',
    startDate: '2099-10-19',
    endDate: '2099-10-19',
    durationMinutes: 60,
    nowIso: '2099-10-14T00:00:00.000Z',
  });
  assert.equal(mondayResult.dates[0]?.isAvailable, true);
  assert.equal(mondayResult.dates[0]?.reason, 'AVAILABLE');
  console.log('[PASS] Availability engine closed-day enforcement');

  console.log('--- All MF-10 Tests Passed Successfully! ---');
}

run().catch((err) => {
  console.error('MF-10 Test Failed:', err);
  process.exit(1);
});

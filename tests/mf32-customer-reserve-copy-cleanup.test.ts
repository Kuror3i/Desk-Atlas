import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('--- Starting MF-32 Customer Reserve Copy Cleanup Tests ---');

  const reservationPagePath = path.resolve(
    process.cwd(),
    'apps/customer-website/src/features/reservation/components/ReservationPage.tsx'
  );
  const scheduleCalendarStepPath = path.resolve(
    process.cwd(),
    'apps/customer-website/src/features/reservation/components/ScheduleCalendarStep.tsx'
  );
  const spotDetailModalPath = path.resolve(
    process.cwd(),
    'apps/customer-website/src/features/reservation/components/SpotDetailModal.tsx'
  );

  const reservationPageContent = fs.readFileSync(reservationPagePath, 'utf8');
  const scheduleCalendarStepContent = fs.readFileSync(scheduleCalendarStepPath, 'utf8');
  const spotDetailModalContent = fs.readFileSync(spotDetailModalPath, 'utf8');

  console.log('1. Verifying Track Reservation button removal from /reserve header...');
  assert.equal(
    reservationPageContent.includes('Track Reservation'),
    false,
    'ReservationPage should not contain "Track Reservation" link button'
  );
  assert.equal(
    reservationPageContent.includes('href="/track"'),
    false,
    'ReservationPage should not link to /track in the header'
  );
  console.log('[PASS] Track Reservation is removed from /reserve flow header');

  console.log('2. Verifying instructional text removal from calendar...');
  assert.equal(
    scheduleCalendarStepContent.includes('Calendar opens to today. Past days are grayed out.'),
    false,
    'ScheduleCalendarStep should not contain "Calendar opens to today. Past days are grayed out."'
  );
  assert.equal(
    reservationPageContent.includes('Calendar opens to today'),
    false,
    'ReservationPage should not contain "Calendar opens to today"'
  );
  console.log('[PASS] Calendar helper instructional copy is removed');

  console.log('3. Verifying internal instance codes (e.g. FOC-5510, instanceCode) are not exposed in /reserve UI...');
  assert.equal(
    reservationPageContent.includes('instanceCode'),
    false,
    'ReservationPage should not reference or display instanceCode'
  );
  assert.equal(
    scheduleCalendarStepContent.includes('instanceCode'),
    false,
    'ScheduleCalendarStep should not reference or display instanceCode'
  );
  assert.equal(
    spotDetailModalContent.includes('instanceCode'),
    false,
    'SpotDetailModal should not reference or display instanceCode'
  );
  console.log('[PASS] Internal instance codes are completely hidden from /reserve screens');

  console.log('4. Verifying essential business-rule copy remains intact...');
  assert.ok(
    reservationPageContent.includes('No-Hold') || reservationPageContent.includes('do not hold inventory'),
    'ReservationPage must retain no-hold business rule explanation'
  );
  assert.ok(
    scheduleCalendarStepContent.includes('No-Hold Rule:'),
    'ScheduleCalendarStep must retain no-hold business rule notice'
  );
  assert.ok(
    spotDetailModalContent.includes('No-Hold Rule:'),
    'SpotDetailModal must retain no-hold rule note'
  );
  console.log('[PASS] Crucial no-hold and allocation business copy remains present and accurate');

  console.log('--- All MF-32 Tests Passed Successfully! ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

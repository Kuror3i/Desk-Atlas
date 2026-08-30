import * as assert from 'assert';
import {
  buildReservationTrackingUrl,
  createGuestReservationTrackingService,
  createTransactionalEmailService,
  GuestReservationTrackingError,
  renderBookingConfirmationEmail,
  renderPaymentLinkEmail,
  renderPaymentProofReceivedEmail,
  renderPaymentProofRejectedEmail,
  renderReservationTrackingEmail,
  ReservationMemoryRepository,
  type CreateReservationRequest,
  createReservationService,
  createPaymentSessionService,
  InMemoryWorkspaceRepository,
} from '../packages/domain/src/index';

async function runTests() {
  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // 1. URL Helper Tests
  await runTest('buildReservationTrackingUrl produces deterministic guest tracking URL', async () => {
    const url1 = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-XYZ');
    assert.strictEqual(url1, 'https://deskatlas.app/track?code=DA-20260901-XYZ');

    const url2 = buildReservationTrackingUrl('https://deskatlas.app/', 'da-20260901-abc');
    assert.strictEqual(url2, 'https://deskatlas.app/track?code=DA-20260901-ABC');

    const url3 = buildReservationTrackingUrl('  http://localhost:3000/  ', '  da-ref-123  ');
    assert.strictEqual(url3, 'http://localhost:3000/track?code=DA-REF-123');
  });

  // 2. Template Rendering with Tracking Links
  await runTest('renderPaymentLinkEmail renders tracking link when provided without leaking sensitive hashes', async () => {
    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-PAY');
    const rendered = renderPaymentLinkEmail({
      to: 'guest@example.com',
      customerFirstName: 'Juan',
      customerLastName: 'Dela Cruz',
      referenceCode: 'DA-20260901-PAY',
      amountDue: 500,
      currency: 'PHP',
      paymentUrl: 'https://deskatlas.app/pay/opaque-token-123',
      expiresAt: '2026-09-01T12:00:00.000Z',
      trackingUrl,
    });

    assert.ok(rendered.subject.includes('DA-20260901-PAY'));
    assert.ok(rendered.html.includes(trackingUrl));
    assert.ok(rendered.text.includes(trackingUrl));
    assert.ok(rendered.html.includes('https://deskatlas.app/pay/opaque-token-123'));
    assert.ok(!rendered.html.includes('sha256'));
    assert.ok(!rendered.html.includes('proof_storage_path'));
  });

  await runTest('renderBookingConfirmationEmail renders tracking link and booking pass URL', async () => {
    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-CONF');
    const rendered = renderBookingConfirmationEmail({
      to: 'guest@example.com',
      customerFirstName: 'Maria',
      customerLastName: 'Clara',
      referenceCode: 'DA-20260901-CONF',
      workspaceDisplayName: 'Desk 5',
      workspaceTemplateName: 'Dedicated Desk',
      floorName: 'Ground Floor',
      bookingStartAt: '2026-09-01T09:00:00.000Z',
      bookingEndAt: '2026-09-01T17:00:00.000Z',
      bookingAccessUrl: 'https://deskatlas.app/api/booking/view/opaque-token-conf',
      bookingToken: 'opaque-token-conf',
      qrIssuedAt: '2026-09-01T08:30:00.000Z',
      trackingUrl,
    });

    assert.ok(rendered.subject.includes('DA-20260901-CONF'));
    assert.ok(rendered.html.includes(trackingUrl));
    assert.ok(rendered.text.includes(trackingUrl));
    assert.ok(rendered.html.includes('https://deskatlas.app/api/booking/view/opaque-token-conf'));
    assert.ok(rendered.html.includes('Desk 5'));
  });

  await runTest('renderPaymentProofReceivedEmail renders tracking link when provided', async () => {
    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-PROOF');
    const rendered = renderPaymentProofReceivedEmail({
      to: 'guest@example.com',
      customerFirstName: 'Ana',
      referenceCode: 'DA-20260901-PROOF',
      trackingUrl,
    });

    assert.ok(rendered.subject.includes('DA-20260901-PROOF'));
    assert.ok(rendered.html.includes(trackingUrl));
    assert.ok(rendered.text.includes(trackingUrl));
    assert.ok(rendered.html.includes('UNDER REVIEW'));
  });

  await runTest('renderPaymentProofRejectedEmail renders tracking link when provided', async () => {
    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-REJ');
    const rendered = renderPaymentProofRejectedEmail({
      to: 'guest@example.com',
      customerFirstName: 'Ana',
      referenceCode: 'DA-20260901-REJ',
      rejectionReason: 'Receipt screenshot unreadable',
      paymentUrl: 'https://deskatlas.app/pay/retry-token',
      trackingUrl,
    });

    assert.ok(rendered.subject.includes('DA-20260901-REJ'));
    assert.ok(rendered.html.includes(trackingUrl));
    assert.ok(rendered.text.includes(trackingUrl));
    assert.ok(rendered.html.includes('Receipt screenshot unreadable'));
  });

  await runTest('renderReservationTrackingEmail renders dedicated status tracking email', async () => {
    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-20260901-TRACK');
    const rendered = renderReservationTrackingEmail({
      to: 'guest@example.com',
      customerFirstName: 'Carlos',
      referenceCode: 'DA-20260901-TRACK',
      trackingUrl,
    });

    assert.ok(rendered.subject.includes('DA-20260901-TRACK'));
    assert.ok(rendered.html.includes(trackingUrl));
    assert.ok(rendered.text.includes(trackingUrl));
    assert.ok(rendered.html.includes('Track Reservation Status'));
  });

  // 3. Service Email Dispatch with Mock Fetcher
  await runTest('sendReservationTrackingEmail dispatches tracking email via Resend API', async () => {
    let capturedBody: any = null;
    let capturedHeaders: any = null;

    const mockFetcher: typeof fetch = async (url, init) => {
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_track_email_123' }),
        text: async () => JSON.stringify({ id: 'resend_track_email_123' }),
      } as any;
    };

    const emailService = createTransactionalEmailService({
      apiKey: 're_test_key_track_789',
      fromEmail: 'DeskAtlas <bookings@deskatlas.com>',
      fetcher: mockFetcher,
    });

    const trackingUrl = buildReservationTrackingUrl('https://deskatlas.app', 'DA-TRACK-SEND');
    const result = await emailService.sendReservationTrackingEmail({
      to: 'customer@example.com',
      customerFirstName: 'Pedro',
      customerLastName: 'Penduko',
      referenceCode: 'DA-TRACK-SEND',
      trackingUrl,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.id, 'resend_track_email_123');
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer re_test_key_track_789');
    assert.deepStrictEqual(capturedBody.to, ['customer@example.com']);
    assert.ok(capturedBody.subject.includes('DA-TRACK-SEND'));
    assert.ok(capturedBody.html.includes(trackingUrl));
  });

  // 4. Guest Tracking Security Invariant Verification
  await runTest('Guest tracking endpoint requires matching email to prevent enumeration', async () => {
    const reservationRepo = new ReservationMemoryRepository();
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const floor = await workspaceRepo.createFloor({ name: 'Floor 1' });
    const template = await workspaceRepo.createTemplate({
      name: 'Flexi Desk',
      capacity: 1,
      rateAmount: 100,
      pricingUnit: 'HOURLY',
      defaultShape: 'rectangle',
      defaultColor: '#1e293b',
      isActive: true,
    });
    const instance = await workspaceRepo.createInstance({
      templateId: template.id,
      floorId: floor.id,
      instanceCode: 'FL-01',
      displayName: 'Flex Desk 1',
    });

    const paymentSessionService = createPaymentSessionService(reservationRepo);
    const reservationService = createReservationService(
      reservationRepo,
      workspaceRepo,
      reservationRepo,
      paymentSessionService
    );
    const trackingService = createGuestReservationTrackingService(reservationRepo);

    const req: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: 'Alice',
      customerLastName: 'Guerrero',
      customerEmail: 'alice@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance.id,
          startAt: '2026-09-01T10:00:00.000Z',
          endAt: '2026-09-01T12:00:00.000Z',
        },
      ],
    };

    const created = await reservationService.createReservation(req, {
      paymentLinkBaseUrl: 'https://deskatlas.test/pay',
    });

    // Valid lookup with matching email
    const trackingInfo = await trackingService.getReservationTracking({
      referenceCode: created.referenceCode,
      customerEmail: 'alice@example.com',
    });
    assert.strictEqual(trackingInfo.referenceCode, created.referenceCode);
    assert.strictEqual(trackingInfo.status, 'PENDING_PAYMENT');

    // Attempting lookup with guessed reference code and wrong email is rejected
    await assert.rejects(
      () =>
        trackingService.getReservationTracking({
          referenceCode: created.referenceCode,
          customerEmail: 'attacker@example.com',
        }),
      (err: any) =>
        err instanceof GuestReservationTrackingError &&
        err.message === 'Reservation tracking details were not found.'
    );
  });

  console.log('All MF-39 Customer Tracking Link Email tests passed!');
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});

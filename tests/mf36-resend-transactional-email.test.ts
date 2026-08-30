import * as assert from 'assert';
import {
  createTransactionalEmailService,
  renderPaymentLinkEmail,
  renderBookingConfirmationEmail,
  renderPaymentProofReceivedEmail,
  renderPaymentProofRejectedEmail,
  renderReservationTrackingEmail,
  TransactionalEmailService,
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

  // 1. Template Rendering Tests
  await runTest('renderPaymentLinkEmail produces valid subject, html, and text without leaking hashes', async () => {
    const rendered = renderPaymentLinkEmail({
      to: 'guest@example.com',
      customerFirstName: 'Maria',
      customerLastName: 'Santos',
      referenceCode: 'DA-20260901-XYZ',
      amountDue: 450.5,
      currency: 'PHP',
      paymentUrl: 'https://deskatlas.app/pay/secure-token-123',
      expiresAt: '2026-09-01T12:00:00.000Z',
    });

    assert.ok(rendered.subject.includes('DA-20260901-XYZ'));
    assert.ok(rendered.html.includes('PHP 450.50'));
    assert.ok(rendered.html.includes('https://deskatlas.app/pay/secure-token-123'));
    assert.ok(rendered.html.includes('Maria Santos'));
    assert.ok(rendered.text.includes('PHP 450.50'));
    assert.ok(rendered.text.includes('DA-20260901-XYZ'));
  });

  await runTest('renderBookingConfirmationEmail includes workspace, timing, and booking access URL', async () => {
    const rendered = renderBookingConfirmationEmail({
      to: 'guest@example.com',
      customerFirstName: 'Juan',
      customerLastName: 'Dela Cruz',
      referenceCode: 'DA-20260901-ABC',
      workspaceDisplayName: 'Desk 12',
      workspaceTemplateName: 'Hot Desk',
      floorName: 'Level 2',
      bookingStartAt: '2026-09-01T09:00:00.000Z',
      bookingEndAt: '2026-09-01T17:00:00.000Z',
      bookingAccessUrl: 'https://deskatlas.app/api/booking/view/opaque-token-abc',
      bookingToken: 'opaque-token-abc',
      qrIssuedAt: '2026-09-01T08:30:00.000Z',
    });

    assert.ok(rendered.subject.includes('DA-20260901-ABC'));
    assert.ok(rendered.html.includes('Desk 12'));
    assert.ok(rendered.html.includes('Hot Desk'));
    assert.ok(rendered.html.includes('Level 2'));
    assert.ok(rendered.html.includes('https://deskatlas.app/api/booking/view/opaque-token-abc'));
    assert.ok(rendered.text.includes('Desk 12'));
    assert.ok(rendered.text.includes('Juan Dela Cruz'));
  });

  await runTest('renderPaymentProofReceivedEmail renders under review notice', async () => {
    const rendered = renderPaymentProofReceivedEmail({
      to: 'guest@example.com',
      customerFirstName: 'Ana',
      referenceCode: 'DA-20260901-REV',
    });

    assert.ok(rendered.subject.includes('DA-20260901-REV'));
    assert.ok(rendered.html.includes('UNDER REVIEW'));
    assert.ok(rendered.html.includes('DA-20260901-REV'));
    assert.ok(rendered.text.includes('DA-20260901-REV'));
  });

  await runTest('renderPaymentProofRejectedEmail renders rejection reason and re-submit URL', async () => {
    const rendered = renderPaymentProofRejectedEmail({
      to: 'guest@example.com',
      customerFirstName: 'Ana',
      referenceCode: 'DA-20260901-REJ',
      rejectionReason: 'Blurry screenshot of payment receipt.',
      paymentUrl: 'https://deskatlas.app/pay/retry-token',
    });

    assert.ok(rendered.subject.includes('DA-20260901-REJ'));
    assert.ok(rendered.html.includes('Blurry screenshot of payment receipt.'));
    assert.ok(rendered.html.includes('https://deskatlas.app/pay/retry-token'));
    assert.ok(rendered.text.includes('Blurry screenshot of payment receipt.'));
  });

  await runTest('renderReservationTrackingEmail renders tracking URL', async () => {
    const rendered = renderReservationTrackingEmail({
      to: 'guest@example.com',
      customerFirstName: 'Carlos',
      referenceCode: 'DA-20260901-TRK',
      trackingUrl: 'https://deskatlas.app/track?code=DA-20260901-TRK',
    });

    assert.ok(rendered.subject.includes('DA-20260901-TRK'));
    assert.ok(rendered.html.includes('https://deskatlas.app/track?code=DA-20260901-TRK'));
    assert.ok(rendered.text.includes('https://deskatlas.app/track?code=DA-20260901-TRK'));
  });

  // 2. Resend Transport Tests with Mock Fetcher
  await runTest('Resend API mode sends correct Authorization header and payload', async () => {
    let capturedUrl = '';
    let capturedHeaders: any = {};
    let capturedBody: any = {};

    const mockFetcher: typeof fetch = async (url, init) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_email_id_12345' }),
        text: async () => JSON.stringify({ id: 'resend_email_id_12345' }),
      } as any;
    };

    const service = createTransactionalEmailService({
      apiKey: 're_test_key_abc123',
      fromEmail: 'DeskAtlas <bookings@resend.example.com>',
      fetcher: mockFetcher,
    });

    const result = await service.sendPaymentLinkEmail({
      to: 'customer@example.com',
      customerFirstName: 'Maria',
      referenceCode: 'DA-REF-999',
      amountDue: 300,
      currency: 'PHP',
      paymentUrl: 'https://deskatlas.app/pay/tok999',
      expiresAt: '2026-09-01T15:00:00.000Z',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.id, 'resend_email_id_12345');
    assert.strictEqual(capturedUrl, 'https://api.resend.com/emails');
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer re_test_key_abc123');
    assert.strictEqual(capturedHeaders['Content-Type'], 'application/json');
    assert.strictEqual(capturedBody.from, 'DeskAtlas <bookings@resend.example.com>');
    assert.deepStrictEqual(capturedBody.to, ['customer@example.com']);
    assert.ok(capturedBody.subject.includes('DA-REF-999'));
    assert.ok(capturedBody.html.includes('https://deskatlas.app/pay/tok999'));
  });

  await runTest('Resend API handles 422 validation error safely', async () => {
    const mockFetcher: typeof fetch = async () => {
      return {
        ok: false,
        status: 422,
        json: async () => ({ message: 'The domain is not verified' }),
        text: async () => '{"message":"The domain is not verified"}',
      } as any;
    };

    const service = createTransactionalEmailService({
      apiKey: 're_test_invalid_domain',
      fromEmail: 'DeskAtlas <unverified@example.com>',
      fetcher: mockFetcher,
    });

    const result = await service.sendBookingConfirmationEmail({
      to: 'customer@example.com',
      customerFirstName: 'Juan',
      customerLastName: 'Dela Cruz',
      referenceCode: 'DA-REF-ERR',
      workspaceDisplayName: 'Spot 1',
      workspaceTemplateName: 'Desk',
      floorName: '1F',
      bookingStartAt: '2026-09-01T10:00:00Z',
      bookingEndAt: '2026-09-01T12:00:00Z',
      bookingAccessUrl: 'https://deskatlas.app/booking/tok',
      bookingToken: 'tok',
      qrIssuedAt: '2026-09-01T09:00:00Z',
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('422'));
  });

  // 3. Webhook Fallback Mode Tests
  await runTest('Webhook fallback mode dispatches backward-compatible payload when no API key is present', async () => {
    let capturedWebhookUrl = '';
    let capturedWebhookBody: any = {};

    const mockFetcher: typeof fetch = async (url, init) => {
      capturedWebhookUrl = String(url);
      capturedWebhookBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
        text: async () => '{"status":"ok"}',
      } as any;
    };

    const service = createTransactionalEmailService({
      apiKey: '',
      webhookUrl: 'https://webhook.internal.test/email',
      fetcher: mockFetcher,
    });

    const result = await service.sendPaymentLinkEmail({
      to: 'customer@example.com',
      referenceCode: 'DA-WEBHOOK-1',
      amountDue: 200,
      currency: 'PHP',
      paymentUrl: 'https://deskatlas.app/pay/tok1',
      expiresAt: '2026-09-01T12:00:00.000Z',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(capturedWebhookUrl, 'https://webhook.internal.test/email');
    assert.strictEqual(capturedWebhookBody.template, 'payment-session');
    assert.strictEqual(capturedWebhookBody.referenceCode, 'DA-WEBHOOK-1');
  });

  // 4. Local Development Fallback Mode Tests
  await runTest('Local dev mode without credentials logs and returns success cleanly', async () => {
    const service = new TransactionalEmailService({
      apiKey: undefined,
      webhookUrl: undefined,
    });

    const result = await service.sendPaymentLinkEmail({
      to: 'local@example.com',
      referenceCode: 'DA-LOCAL-1',
      amountDue: 150,
      currency: 'PHP',
      paymentUrl: 'http://localhost:3001/pay/local-tok',
      expiresAt: '2026-09-01T12:00:00.000Z',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.id, 'mock-local-skipped');
  });

  console.log('All MF-36 Resend Transactional Email tests passed!');
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});

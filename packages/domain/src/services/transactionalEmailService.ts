/**
 * DeskAtlas Resend Transactional Email Service
 * 
 * Provides server-side transactional email capabilities for:
 * - Payment session link dispatch
 * - Booking confirmation dispatch (with digital access QR link)
 * - Payment proof received / under review notification
 * - Payment proof rejected notification
 * - Reservation tracking link dispatch
 */

export interface ResendEmailConfig {
  apiKey?: string;
  fromEmail?: string;
  webhookUrl?: string;
  fetcher?: typeof fetch;
}

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export function buildReservationTrackingUrl(baseUrl: string, referenceCode: string): string {
  const cleanBase = (baseUrl || '').trim().replace(/\/$/, '');
  const encodedRef = encodeURIComponent(referenceCode.trim().toUpperCase());
  return `${cleanBase}/track?code=${encodedRef}`;
}

export interface PaymentLinkEmailInput {
  to: string;
  customerFirstName?: string;
  customerLastName?: string;
  referenceCode: string;
  amountDue: number;
  currency: string;
  paymentUrl: string;
  expiresAt: string;
  trackingUrl?: string;
}

export interface BookingConfirmationEmailInput {
  to: string;
  customerFirstName?: string;
  customerLastName?: string;
  referenceCode: string;
  workspaceDisplayName: string;
  workspaceTemplateName: string;
  floorName: string;
  bookingStartAt: string;
  bookingEndAt: string;
  bookingAccessUrl: string;
  bookingToken: string;
  qrIssuedAt: string;
  trackingUrl?: string;
}

export interface PaymentProofReceivedEmailInput {
  to: string;
  customerFirstName?: string;
  customerLastName?: string;
  referenceCode: string;
  trackingUrl?: string;
}

export interface PaymentProofRejectedEmailInput {
  to: string;
  customerFirstName?: string;
  customerLastName?: string;
  referenceCode: string;
  rejectionReason?: string;
  paymentUrl?: string;
  trackingUrl?: string;
}

export interface ReservationTrackingEmailInput {
  to: string;
  customerFirstName?: string;
  customerLastName?: string;
  referenceCode: string;
  trackingUrl: string;
}

export interface RawEmailInput {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export function renderPaymentLinkEmail(input: PaymentLinkEmailInput): { subject: string; html: string; text: string } {
  const customerName = [input.customerFirstName, input.customerLastName].filter(Boolean).join(' ') || 'Customer';
  const subject = `Complete Your DeskAtlas Reservation Payment [${input.referenceCode}]`;
  const formattedAmount = `${input.currency.toUpperCase()} ${Number(input.amountDue).toFixed(2)}`;
  const expiresFormatted = new Date(input.expiresAt).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' UTC';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .reference-badge { display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: 600; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .amount-box { background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .amount-label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-val { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; text-align: center; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
    .warning { color: #d97706; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">DeskAtlas Reservation Payment</div>
      <div>Reference: <span class="reference-badge">${escapeHtml(input.referenceCode)}</span></div>
    </div>
    <div class="content">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>Your workspace reservation request has been created. Please complete your payment and submit proof to secure your spot.</p>
      
      <div class="amount-box">
        <div class="amount-label">Amount Due</div>
        <div class="amount-val">${escapeHtml(formattedAmount)}</div>
      </div>

      <div style="text-align: center;">
        <a href="${escapeHtml(input.paymentUrl)}" class="btn">Proceed to Payment</a>
      </div>

      <p class="warning">⚠️ <strong>1-Hour Session:</strong> Payment link expires at <strong>${escapeHtml(expiresFormatted)}</strong>. Spot allocation is finalized only after successful payment proof verification.</p>
      
      ${input.trackingUrl ? `
      <p style="font-size: 13px; color: #475569; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        Track live status: <a href="${escapeHtml(input.trackingUrl)}" style="color: #0284c7; text-decoration: underline;">${escapeHtml(input.trackingUrl)}</a>
      </p>
      ` : ''}

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${escapeHtml(input.paymentUrl)}" style="color: #0284c7; word-break: break-all;">${escapeHtml(input.paymentUrl)}</a>
      </p>
    </div>
    <div class="footer">
      DeskAtlas Workspace Reservation System &bull; This is an automated transactional message.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
DeskAtlas Reservation Payment
Reference: ${input.referenceCode}

Hello ${customerName},

Your workspace reservation request has been created. Please complete your payment and submit proof to secure your spot.

Amount Due: ${formattedAmount}
Payment URL: ${input.paymentUrl}

Session Expiry: ${expiresFormatted} (1 hour)
${input.trackingUrl ? `Track Reservation: ${input.trackingUrl}\n` : ''}Note: Selecting a spot or submitting a request does not hold inventory. Spot allocation is finalized only after payment proof approval.

DeskAtlas Workspace Reservation System
  `.trim();

  return { subject, html, text };
}

export function renderBookingConfirmationEmail(input: BookingConfirmationEmailInput): { subject: string; html: string; text: string } {
  const customerName = [input.customerFirstName, input.customerLastName].filter(Boolean).join(' ') || 'Customer';
  const subject = `Booking Confirmed: ${input.referenceCode} - DeskAtlas`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .confirmed-badge { display: inline-block; background-color: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td:first-child { color: #64748b; font-weight: 500; width: 35%; }
    .details-table td:last-child { color: #0f172a; font-weight: 600; }
    .btn { display: inline-block; background-color: #15803d; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; text-align: center; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Booking Confirmed! 🎉</div>
      <span class="confirmed-badge">CONFIRMED</span>
    </div>
    <div class="content">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>Your workspace reservation has been approved and confirmed. Here are your booking details:</p>
      
      <table class="details-table">
        <tr>
          <td>Reference Code</td>
          <td><code>${escapeHtml(input.referenceCode)}</code></td>
        </tr>
        <tr>
          <td>Assigned Spot</td>
          <td>${escapeHtml(input.workspaceDisplayName)} (${escapeHtml(input.workspaceTemplateName)})</td>
        </tr>
        <tr>
          <td>Floor</td>
          <td>${escapeHtml(input.floorName)}</td>
        </tr>
        <tr>
          <td>Start Time</td>
          <td>${escapeHtml(input.bookingStartAt)}</td>
        </tr>
        <tr>
          <td>End Time</td>
          <td>${escapeHtml(input.bookingEndAt)}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${escapeHtml(input.bookingAccessUrl)}" class="btn">View Digital Pass & QR Code</a>
      </div>

      ${input.trackingUrl ? `
      <p style="font-size: 13px; color: #475569; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        Track live reservation status: <a href="${escapeHtml(input.trackingUrl)}" style="color: #15803d; text-decoration: underline;">${escapeHtml(input.trackingUrl)}</a>
      </p>
      ` : ''}

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        Present your Digital Pass / Booking QR code at the reception desk upon arrival during your booked reservation window.<br><br>
        Direct Pass Link: <a href="${escapeHtml(input.bookingAccessUrl)}" style="color: #15803d; word-break: break-all;">${escapeHtml(input.bookingAccessUrl)}</a>
      </p>
    </div>
    <div class="footer">
      DeskAtlas Workspace Reservation System &bull; This is an automated transactional message.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Booking Confirmed! - DeskAtlas
Reference: ${input.referenceCode}

Hello ${customerName},

Your workspace reservation has been confirmed.

Assigned Spot: ${input.workspaceDisplayName} (${input.workspaceTemplateName})
Floor: ${input.floorName}
Start Time: ${input.bookingStartAt}
End Time: ${input.bookingEndAt}

Digital Pass / Booking QR Link: ${input.bookingAccessUrl}
${input.trackingUrl ? `Track Reservation: ${input.trackingUrl}\n` : ''}
Please present your Digital Pass / QR code upon arrival at the workspace.

DeskAtlas Workspace Reservation System
  `.trim();

  return { subject, html, text };
}

export function renderPaymentProofReceivedEmail(input: PaymentProofReceivedEmailInput): { subject: string; html: string; text: string } {
  const customerName = [input.customerFirstName, input.customerLastName].filter(Boolean).join(' ') || 'Customer';
  const subject = `Payment Proof Received - Reservation ${input.referenceCode}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 560px; margin: 0 auto; padding: 32px; }
    .header { margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .badge { display: inline-block; background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Payment Proof Under Review</div>
      <span class="badge" style="margin-top: 6px;">UNDER REVIEW</span>
    </div>
    <div class="content">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>We have successfully received your payment proof for reservation <strong>${escapeHtml(input.referenceCode)}</strong>.</p>
      <p>Our admin team is currently reviewing the submission. Once verified, your workspace spot will be allocated and you will receive a booking confirmation email with your digital pass and access QR code.</p>

      ${input.trackingUrl ? `
      <p style="font-size: 13px; color: #475569; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        Track live reservation status: <a href="${escapeHtml(input.trackingUrl)}" style="color: #0284c7; text-decoration: underline;">${escapeHtml(input.trackingUrl)}</a>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      DeskAtlas Workspace Reservation System
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Proof Under Review - DeskAtlas
Reference: ${input.referenceCode}

Hello ${customerName},

We have received your payment proof for reservation ${input.referenceCode}.
Our team is reviewing the submission. You will receive a confirmation email once approved.
${input.trackingUrl ? `Track Reservation: ${input.trackingUrl}\n` : ''}
DeskAtlas Workspace Reservation System
  `.trim();

  return { subject, html, text };
}

export function renderPaymentProofRejectedEmail(input: PaymentProofRejectedEmailInput): { subject: string; html: string; text: string } {
  const customerName = [input.customerFirstName, input.customerLastName].filter(Boolean).join(' ') || 'Customer';
  const subject = `Payment Proof Update - Reservation ${input.referenceCode}`;
  const reason = input.rejectionReason || 'The payment proof could not be verified by the admin team.';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 560px; margin: 0 auto; padding: 32px; }
    .header { margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .title { font-size: 18px; font-weight: 700; color: #dc2626; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .reason-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 16px 0; color: #991b1b; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 12px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Payment Proof Update</div>
    </div>
    <div class="content">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>Your payment proof for reservation <strong>${escapeHtml(input.referenceCode)}</strong> could not be verified.</p>
      
      <div class="reason-box">
        <strong>Reason:</strong> ${escapeHtml(reason)}
      </div>

      ${input.paymentUrl ? `
      <p>If your 1-hour session is still active, you may re-submit a valid payment proof using the link below:</p>
      <div style="text-align: center;">
        <a href="${escapeHtml(input.paymentUrl)}" class="btn">Re-submit Payment Proof</a>
      </div>
      ` : ''}

      ${input.trackingUrl ? `
      <p style="font-size: 13px; color: #475569; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        Track live reservation status: <a href="${escapeHtml(input.trackingUrl)}" style="color: #0284c7; text-decoration: underline;">${escapeHtml(input.trackingUrl)}</a>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      DeskAtlas Workspace Reservation System
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Proof Update - DeskAtlas
Reference: ${input.referenceCode}

Hello ${customerName},

Your payment proof for reservation ${input.referenceCode} could not be verified.

Reason: ${reason}
${input.paymentUrl ? `Re-submit proof (if session is active): ${input.paymentUrl}\n` : ''}${input.trackingUrl ? `Track Reservation: ${input.trackingUrl}\n` : ''}DeskAtlas Workspace Reservation System
  `.trim();

  return { subject, html, text };
}

export function renderReservationTrackingEmail(input: ReservationTrackingEmailInput): { subject: string; html: string; text: string } {
  const customerName = [input.customerFirstName, input.customerLastName].filter(Boolean).join(' ') || 'Customer';
  const subject = `Track Your DeskAtlas Reservation [${input.referenceCode}]`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 560px; margin: 0 auto; padding: 32px; }
    .header { margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">DeskAtlas Reservation Status</div>
      <div>Reference: <strong>${escapeHtml(input.referenceCode)}</strong></div>
    </div>
    <div class="content">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>You can track the live status of your reservation at any time using the link below:</p>
      
      <div style="text-align: center;">
        <a href="${escapeHtml(input.trackingUrl)}" class="btn">Track Reservation Status</a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        Tracking Link: <a href="${escapeHtml(input.trackingUrl)}" style="color: #0284c7; word-break: break-all;">${escapeHtml(input.trackingUrl)}</a>
      </p>
    </div>
    <div class="footer">
      DeskAtlas Workspace Reservation System
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
DeskAtlas Reservation Status
Reference: ${input.referenceCode}

Hello ${customerName},

Track the live status of your reservation here:
${input.trackingUrl}

DeskAtlas Workspace Reservation System
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class TransactionalEmailService {
  private readonly apiKey?: string;
  private readonly fromEmail: string;
  private readonly webhookUrl?: string;
  private readonly fetcher: typeof fetch;

  constructor(config?: ResendEmailConfig) {
    this.apiKey = config?.apiKey ?? process.env.RESEND_API_KEY;
    this.fromEmail = config?.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? 'DeskAtlas <noreply@deskatlas.com>';
    this.webhookUrl = config?.webhookUrl ?? process.env.TRANSACTIONAL_EMAIL_WEBHOOK_URL;
    this.fetcher = config?.fetcher ?? fetch;
  }

  async sendEmail(input: RawEmailInput): Promise<EmailSendResult> {
    const to = Array.isArray(input.to) ? input.to : [input.to];
    const from = input.from || this.fromEmail;

    // 1. Resend API mode if RESEND_API_KEY is configured
    if (this.apiKey) {
      try {
        const response = await this.fetcher('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to,
            subject: input.subject,
            html: input.html,
            text: input.text,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[TransactionalEmail] Resend API error (${response.status}):`, errorText);
          return { success: false, error: `Resend error (${response.status}): ${errorText}` };
        }

        const data: any = await response.json();
        return { success: true, id: data?.id };
      } catch (err: any) {
        console.error('[TransactionalEmail] Failed to send via Resend:', err.message);
        return { success: false, error: err.message };
      }
    }

    // 2. Backward-compatible Webhook mode if TRANSACTIONAL_EMAIL_WEBHOOK_URL is configured
    if (this.webhookUrl) {
      try {
        const response = await this.fetcher(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            from,
            subject: input.subject,
            html: input.html,
            text: input.text,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[TransactionalEmail] Webhook error (${response.status}):`, errorText);
          return { success: false, error: `Webhook error: ${errorText}` };
        }

        return { success: true, id: 'webhook-dispatched' };
      } catch (err: any) {
        console.warn('[TransactionalEmail] Failed to dispatch email webhook:', err.message);
        return { success: false, error: err.message };
      }
    }

    // 3. Fallback logged mode for local development without credentials
    console.info(`[TransactionalEmail] Skipped sending "${input.subject}" to [${to.join(', ')}]; no RESEND_API_KEY or TRANSACTIONAL_EMAIL_WEBHOOK_URL configured.`);
    return { success: true, id: 'mock-local-skipped' };
  }

  async sendPaymentLinkEmail(input: PaymentLinkEmailInput): Promise<EmailSendResult> {
    const rendered = renderPaymentLinkEmail(input);

    // If webhookUrl is configured without Resend API key, maintain backward-compatible payload schema
    if (!this.apiKey && this.webhookUrl) {
      try {
        await this.fetcher(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: 'payment-session',
            ...input,
          }),
        });
        return { success: true, id: 'webhook-payment-session' };
      } catch (err: any) {
        console.warn('[TransactionalEmail] Payment link webhook dispatch error:', err.message);
      }
    }

    return this.sendEmail({
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendBookingConfirmationEmail(input: BookingConfirmationEmailInput): Promise<EmailSendResult> {
    const rendered = renderBookingConfirmationEmail(input);

    // If webhookUrl is configured without Resend API key, maintain backward-compatible payload schema
    if (!this.apiKey && this.webhookUrl) {
      try {
        await this.fetcher(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: 'booking-confirmed',
            ...input,
          }),
        });
        return { success: true, id: 'webhook-booking-confirmed' };
      } catch (err: any) {
        console.warn('[TransactionalEmail] Booking confirmed webhook dispatch error:', err.message);
      }
    }

    return this.sendEmail({
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendPaymentProofReceivedEmail(input: PaymentProofReceivedEmailInput): Promise<EmailSendResult> {
    const rendered = renderPaymentProofReceivedEmail(input);
    return this.sendEmail({
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendPaymentProofRejectedEmail(input: PaymentProofRejectedEmailInput): Promise<EmailSendResult> {
    const rendered = renderPaymentProofRejectedEmail(input);
    return this.sendEmail({
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendReservationTrackingEmail(input: ReservationTrackingEmailInput): Promise<EmailSendResult> {
    const rendered = renderReservationTrackingEmail(input);
    return this.sendEmail({
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}

export function createTransactionalEmailService(config?: ResendEmailConfig): TransactionalEmailService {
  return new TransactionalEmailService(config);
}

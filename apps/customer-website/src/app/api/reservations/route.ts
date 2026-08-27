import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createPaymentSessionService,
  ReservationSupabaseRepository,
  createReservationService,
  CreateReservationRequest,
  ReservationError,
} from '@deskatlas/domain';

export const runtime = 'nodejs';

// A simple Supabase-based workspace repository for validation lookups
class CustomerWorkspaceRepo {
  constructor(private supabase: any) {}

  async listCatalog() {
    const { data: instancesData, error: instError } = await this.supabase.from('workspace_instances').select('*');
    if (instError) throw new Error(instError.message);
    
    const { data: templatesData, error: tplError } = await this.supabase.from('workspace_templates').select('*');
    if (tplError) throw new Error(tplError.message);

    const instances = instancesData.map((d: any) => ({
      id: d.id,
      templateId: d.template_id,
      floorId: d.floor_id,
      instanceCode: d.instance_code,
      displayName: d.display_name,
      operationalStatus: d.operational_status,
    }));

    const templates = templatesData.map((d: any) => ({
      id: d.id,
      name: d.name,
      capacity: d.capacity,
      rateAmount: Number(d.rate_amount),
      pricingUnit: d.pricing_unit,
      isActive: d.is_active,
    }));

    return { instances, templates, floors: [] };
  }
}

async function dispatchPaymentLinkEmail(input: {
  to: string;
  referenceCode: string;
  amountDue: number;
  currency: string;
  paymentUrl: string;
  expiresAt: string;
}) {
  const webhookUrl = process.env.TRANSACTIONAL_EMAIL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.info('Payment session email dispatch skipped; no TRANSACTIONAL_EMAIL_WEBHOOK_URL configured.', input);
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'payment-session',
      ...input,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const reservationRepo = new ReservationSupabaseRepository({ supabaseUrl, serviceRoleKey: supabaseKey });
    const workspaceRepo = new CustomerWorkspaceRepo(supabase);
    const paymentSessionService = createPaymentSessionService(reservationRepo);
    const service = createReservationService(
      reservationRepo,
      workspaceRepo as any,
      reservationRepo,
      paymentSessionService
    );

    const body: CreateReservationRequest = await request.json();
    const paymentLinkBaseUrl =
      process.env.PAYMENT_SESSION_BASE_URL ??
      `${request.nextUrl.origin.replace(/\/$/, '')}/pay`;

    const reservation = await service.createReservation(body, {
      paymentLinkBaseUrl,
    });

    if (reservation.paymentSession) {
      await dispatchPaymentLinkEmail({
        to: reservation.customerEmail,
        referenceCode: reservation.referenceCode,
        amountDue: reservation.amountDue,
        currency: reservation.currency,
        paymentUrl: reservation.paymentSession.paymentUrl,
        expiresAt: reservation.paymentSession.expiresAt,
      });
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unable to create reservation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

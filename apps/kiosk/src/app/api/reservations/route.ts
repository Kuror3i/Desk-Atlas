import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createReservationService,
  CreateReservationRequest,
  ReservationError,
  ReservationSupabaseRepository,
} from "@deskatlas/domain";

export const runtime = "nodejs";

class KioskWorkspaceRepo {
  constructor(private readonly supabase: any) {}

  async listCatalog() {
    const { data: instancesData, error: instanceError } = await this.supabase
      .from("workspace_instances")
      .select("*");
    if (instanceError) {
      throw new Error(instanceError.message);
    }

    const { data: templatesData, error: templateError } = await this.supabase
      .from("workspace_templates")
      .select("*");
    if (templateError) {
      throw new Error(templateError.message);
    }

    const instances = instancesData.map((row: any) => ({
      id: row.id,
      templateId: row.template_id,
      floorId: row.floor_id,
      instanceCode: row.instance_code,
      displayName: row.display_name,
      operationalStatus: row.operational_status,
    }));

    const templates = templatesData.map((row: any) => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      rateAmount: Number(row.rate_amount),
      pricingUnit: row.pricing_unit,
      isActive: row.is_active,
    }));

    return { instances, templates, floors: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing.");
    }

    const body: any = await request.json();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const reservationRepository = new ReservationSupabaseRepository({
      supabaseUrl,
      serviceRoleKey: supabaseKey,
    });
    const workspaceRepository = new KioskWorkspaceRepo(supabase);
    const reservationService = createReservationService(
      reservationRepository,
      workspaceRepository as any,
      reservationRepository
    );

    let createRequest: CreateReservationRequest;

    if (body.candidates && Array.isArray(body.candidates)) {
      createRequest = {
        source: "KIOSK",
        customerFirstName: body.customerFirstName ?? body.customer?.firstName,
        customerLastName: body.customerLastName ?? body.customer?.lastName,
        customerEmail: body.customerEmail ?? body.customer?.email,
        paymentMethodId: body.paymentMethodId ?? (body.paymentMethod === "counter_cash" ? "pm-cash" : "pm-gcash"),
        candidates: body.candidates,
      };
    } else {
      const now = new Date();
      const durationMin = Number(body.durationMinutes) || (Number(body.durationHours) * 60) || 120;
      let startAt: string;
      if (body.startAt) {
        startAt = new Date(body.startAt).toISOString();
      } else if (body.date && body.startTime) {
        startAt = new Date(`${body.date}T${body.startTime}`).toISOString();
      } else {
        startAt = now.toISOString();
      }
      const endAt = body.endAt
        ? new Date(body.endAt).toISOString()
        : new Date(new Date(startAt).getTime() + durationMin * 60000).toISOString();

      createRequest = {
        source: "KIOSK",
        customerFirstName: body.customerFirstName ?? body.customer?.firstName,
        customerLastName: body.customerLastName ?? body.customer?.lastName,
        customerEmail: body.customerEmail ?? body.customer?.email,
        paymentMethodId: body.paymentMethodId ?? (body.paymentMethod === "counter_cash" ? "pm-cash" : "pm-gcash"),
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: body.workspaceInstanceId,
            startAt,
            endAt,
          },
        ],
      };
    }

    const reservation = await reservationService.createReservation(createRequest);

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to create kiosk reservation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

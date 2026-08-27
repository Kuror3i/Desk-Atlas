import { NextRequest, NextResponse } from "next/server";
import {
  createStaffOperationsService,
  ReservationSupabaseRepository,
  StaffOperationsConflictError,
  StaffOperationsError,
} from "@deskatlas/domain";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      reservationId: string;
    }>;
  }
) {
  try {
    const { reservationId } = await context.params;
    const body = await request.json();
    const service = createStaffOperationsService(new ReservationSupabaseRepository());
    const result = await service.checkOutReservation({
      reservationId,
      actor: {
        userId: String(body.actorUserId ?? "").trim(),
        role: body.actorRole,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StaffOperationsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof StaffOperationsConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to check out reservation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

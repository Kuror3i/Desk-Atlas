import { NextRequest, NextResponse } from "next/server";
import { getAdminReservationService } from "../_lib/reservationService";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Reservation ID is required." },
        { status: 400 }
      );
    }

    const service = getAdminReservationService();
    const detail = await service.getReservationDetail(id);

    if (!detail) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load reservation detail.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

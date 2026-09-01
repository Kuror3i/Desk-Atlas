import { NextRequest, NextResponse } from "next/server";
import {
  BookingAccessError,
  createBookingAccessService,
  ReservationSupabaseRepository,
} from "@deskatlas/domain";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  try {
    const { token } = await context.params;
    const decodedToken = decodeURIComponent(token || "").trim();
    const service = createBookingAccessService(new ReservationSupabaseRepository());
    const result = await service.resolveBookingAccess(decodedToken);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to resolve booking access token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

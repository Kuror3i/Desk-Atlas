import { NextRequest, NextResponse } from "next/server";
import {
  createStaffDashboardService,
  ReservationSupabaseRepository,
  StaffDashboardError,
  StaffOperationsConflictError,
  StaffOperationsError,
  SupabaseWorkspaceRepository,
} from "@deskatlas/domain";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rangeParam = request.nextUrl.searchParams.get("range") ?? "today";
    const reservationRepo = new ReservationSupabaseRepository();
    const workspaceRepo = new SupabaseWorkspaceRepository();
    const service = createStaffDashboardService(reservationRepo, reservationRepo, workspaceRepo);
    const snapshot = await service.getDashboardSnapshot(rangeParam);
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof StaffDashboardError || error instanceof StaffOperationsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof StaffOperationsConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to load staff dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

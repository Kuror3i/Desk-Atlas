import { NextRequest, NextResponse } from "next/server";
import { AdminDashboardRange } from "@deskatlas/domain";
import { getAdminDashboardService } from "./_lib/dashboardService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rangeParam = request.nextUrl.searchParams.get("range") ?? "today";
    const range: AdminDashboardRange =
      rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

    const service = getAdminDashboardService();
    const snapshot = await service.getDashboardSnapshot(range);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

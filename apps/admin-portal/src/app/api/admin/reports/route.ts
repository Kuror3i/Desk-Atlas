import { AdminReportRange } from "@deskatlas/domain";
import { NextRequest, NextResponse } from "next/server";
import { getAdminReportsService } from "./_lib/reportsService";

export const runtime = "nodejs";

const validRanges = new Set<AdminReportRange>(["today", "7days", "30days", "month", "year"]);

export async function GET(request: NextRequest) {
  const rangeParam = request.nextUrl.searchParams.get("range") as AdminReportRange | null;
  const range = rangeParam && validRanges.has(rangeParam) ? rangeParam : "month";

  try {
    const snapshot = await getAdminReportsService().getAdminReportsSnapshot(range);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

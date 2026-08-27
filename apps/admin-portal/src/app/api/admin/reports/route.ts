import { NextResponse } from "next/server";
import { getAdminReportsService } from "./_lib/reportsService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getAdminReportsService().getAdminReportsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

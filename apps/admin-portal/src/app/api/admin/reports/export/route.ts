import { type AdminReportExportType } from "@deskatlas/domain";
import { NextRequest, NextResponse } from "next/server";
import { getAdminReportsService } from "../_lib/reportsService";

const allowedExportTypes = new Set<AdminReportExportType>([
  "operations-summary",
  "workspace",
  "reservations",
  "payment",
  "booking-activity",
  "cancellation",
  "checkin",
]);

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const exportType = request.nextUrl.searchParams.get("type") as AdminReportExportType | null;

  if (!exportType || !allowedExportTypes.has(exportType)) {
    return NextResponse.json({ error: "Invalid report export type." }, { status: 400 });
  }

  try {
    const report = await getAdminReportsService().exportAdminReport(exportType);
    return new NextResponse(report.content, {
      status: 200,
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export admin report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

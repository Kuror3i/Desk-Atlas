import { NextRequest, NextResponse } from "next/server";
import { SettingsValidationError } from "@deskatlas/domain";
import { getAdminSettingsService } from "../_lib/settingsService";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;
    const actorRole = request.headers.get("x-user-role") ?? "ADMIN";

    const updated = await service.updatePaymentMethod(
      {
        id: body.id,
        displayName: body.displayName,
        accountName: body.accountName,
        accountNumber: body.accountNumber,
        qrImagePath: body.qrImagePath,
        instructions: body.instructions,
        allowWeb: body.allowWeb,
        allowKiosk: body.allowKiosk,
        isActive: body.isActive,
        displayOrder: body.displayOrder,
      },
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update payment method.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

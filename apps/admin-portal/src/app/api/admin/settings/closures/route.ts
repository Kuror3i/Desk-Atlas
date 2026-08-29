import { NextRequest, NextResponse } from "next/server";
import { SettingsValidationError } from "@deskatlas/domain";
import { getAdminSettingsService } from "../_lib/settingsService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const service = getAdminSettingsService();
    const closures = await service.listClosures();
    return NextResponse.json({ data: closures });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Failed to load closures.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;
    const actorRole = request.headers.get("x-user-role") ?? "ADMIN";

    const created = await service.createClosure(
      {
        date: body.date,
        endDate: body.endDate || null,
        closureType: body.closureType,
        opensAt: body.opensAt || null,
        closesAt: body.closesAt || null,
        reason: body.reason || null,
      },
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create closure exception.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;

    let blockIds: string[] = [];
    if (Array.isArray(body.blockIds) && body.blockIds.length > 0) {
      blockIds = body.blockIds;
    } else if (typeof body.id === "string" && body.id.trim()) {
      blockIds = [body.id.trim()];
    } else {
      const url = new URL(request.url);
      const idParam = url.searchParams.get("id");
      if (idParam) {
        blockIds = [idParam];
      }
    }

    if (blockIds.length === 0) {
      return NextResponse.json(
        { error: "At least one closure block ID is required for deletion" },
        { status: 400 }
      );
    }

    await service.deleteClosure(
      blockIds,
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete closure exception.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { SettingsValidationError } from "@deskatlas/domain";
import { getAdminSettingsService } from "../_lib/settingsService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;

    const created = await service.createPaymentMethod(
      {
        methodType: body.methodType,
        displayName: body.displayName,
        accountName: body.accountName,
        accountNumber: body.accountNumber,
        qrImagePath: body.qrImagePath,
        instructions: body.instructions,
        allowWeb: Boolean(body.allowWeb),
        allowKiosk: Boolean(body.allowKiosk),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
      },
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create payment method.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;

    const updated = await service.updatePaymentMethod(
      {
        id: body.id,
        methodType: body.methodType,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    const service = getAdminSettingsService();
    const actorUserId = request.headers.get("x-user-id") ?? undefined;

    await service.deletePaymentMethod(
      id,
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete payment method.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = getAdminSettingsService();

    const actorUserId = request.headers.get("x-user-id") ?? undefined;

    if (!Array.isArray(body.orderedIds)) {
      return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
    }

    const reordered = await service.reorderPaymentMethods(
      body.orderedIds,
      actorUserId ? { id: actorUserId, name: "Admin", role: "admin" } : null
    );

    return NextResponse.json({ data: reordered });
  } catch (error: any) {
    if (error instanceof SettingsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to reorder payment methods.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  StaffManagementAuthorizationError,
  StaffManagementConflictError,
  StaffManagementError,
} from "@deskatlas/domain";
import { getStaffManagementService } from "../_lib/staffService";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Staff user ID is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { displayName, role, isActive, password } = body;

    const actorUserId = request.headers.get("x-user-id") ?? body.actorUserId ?? undefined;
    const actorRole = (request.headers.get("x-user-role") ?? body.actorRole ?? "ADMIN") as "ADMIN" | "STAFF";

    const service = getStaffManagementService();
    const updated = await service.updateStaff({
      staffUserId: id,
      displayName,
      role: role ? (role.toUpperCase() as "ADMIN" | "STAFF") : undefined,
      isActive,
      password,
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ staff: updated });
  } catch (error: any) {
    if (error instanceof StaffManagementConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof StaffManagementAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof StaffManagementError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update staff account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

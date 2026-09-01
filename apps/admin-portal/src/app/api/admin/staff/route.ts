import { NextRequest, NextResponse } from "next/server";
import {
  StaffManagementAuthorizationError,
  StaffManagementConflictError,
  StaffManagementError,
} from "@deskatlas/domain";
import { getStaffManagementService } from "./_lib/staffService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actorUserId = request.headers.get("x-user-id") ?? undefined;
    const actorRole = (request.headers.get("x-user-role") ?? "ADMIN") as "ADMIN" | "STAFF";

    const service = getStaffManagementService();
    const staff = await service.listStaff(actorUserId ? { userId: actorUserId, role: actorRole } : undefined);
    return NextResponse.json({ staff });
  } catch (error: any) {
    if (error instanceof StaffManagementAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to load staff accounts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, displayName, role } = body;

    const actorUserId = request.headers.get("x-user-id") ?? body.actorUserId ?? undefined;
    const actorRole = (request.headers.get("x-user-role") ?? body.actorRole ?? "ADMIN") as "ADMIN" | "STAFF";

    if (!email || !displayName || !role) {
      return NextResponse.json(
        { error: "Email, display name, and role are required." },
        { status: 400 }
      );
    }

    const service = getStaffManagementService();
    const created = await service.createStaff({
      email,
      password,
      displayName,
      role: role.toUpperCase() as "ADMIN" | "STAFF",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ staff: created }, { status: 201 });
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
    const message = error instanceof Error ? error.message : "Failed to create staff account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

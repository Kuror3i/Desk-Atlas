import { NextRequest, NextResponse } from 'next/server';
import { getAdminWorkspaceService } from '../_lib/workspaceService';
import { workspaceErrorResponse } from '../_lib/errors';
import type { CreateFloorInput } from '@deskatlas/domain';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateFloorInput;
    const service = getAdminWorkspaceService();
    const floor = await service.createFloor(body);
    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

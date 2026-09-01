import { NextResponse } from 'next/server';
import { getAdminWorkspaceService } from '../../../_lib/workspaceService';
import { workspaceErrorResponse } from '../../../_lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await context.params;
    const instance = await getAdminWorkspaceService().duplicateInstance(instanceId, await request.json());
    return NextResponse.json({ instance }, { status: 201 });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

import { NextResponse } from 'next/server';
import { getAdminWorkspaceService } from '../../_lib/workspaceService';
import { workspaceErrorResponse } from '../../_lib/errors';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await context.params;
    const result = await getAdminWorkspaceService().updateManagedInstance(instanceId, await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await context.params;
    const instance = await getAdminWorkspaceService().deactivateInstance(instanceId);
    return NextResponse.json({ instance });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

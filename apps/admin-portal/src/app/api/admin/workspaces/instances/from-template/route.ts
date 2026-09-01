import { NextResponse } from 'next/server';
import { getAdminWorkspaceService } from '../../_lib/workspaceService';
import { workspaceErrorResponse } from '../../_lib/errors';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const instance = await getAdminWorkspaceService().createInstanceFromTemplate(await request.json());
    return NextResponse.json({ instance }, { status: 201 });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

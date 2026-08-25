import { NextResponse } from 'next/server';
import { getAdminWorkspaceService } from './_lib/workspaceService';
import { workspaceErrorResponse } from './_lib/errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const spaces = await getAdminWorkspaceService().listAdminSpaces();
    return NextResponse.json({ spaces });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

import { NextResponse } from 'next/server';
import {
  SupabaseWorkspaceRepository,
  createWorkspaceService,
  WorkspaceValidationError,
} from '@deskatlas/domain';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await context.params;
    const body = await request.json();

    if (!body.operationalStatus) {
      return NextResponse.json(
        { error: 'operationalStatus is required' },
        { status: 400 }
      );
    }

    const service = createWorkspaceService(new SupabaseWorkspaceRepository());
    // Strictly mutate only operationalStatus and record audit with actorRole: 'STAFF'
    const result = await service.updateManagedInstance(
      instanceId,
      { operationalStatus: body.operationalStatus },
      { actorRole: 'STAFF', actorUserId: 'STAFF_OPERATOR' }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspaceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update workspace operational status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

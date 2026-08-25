import { NextResponse } from 'next/server';
import { WorkspaceConflictError, WorkspaceValidationError } from '@deskatlas/domain';

export function workspaceErrorResponse(error: unknown) {
  if (error instanceof WorkspaceValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof WorkspaceConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error && error.message.includes('SUPABASE_')) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const message = error instanceof Error ? error.message : 'Workspace request failed';
  return NextResponse.json({ error: message }, { status: 500 });
}

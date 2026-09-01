import { NextResponse } from 'next/server';
import { MapConflictError, MapValidationError } from '@deskatlas/domain';

export function mapErrorResponse(error: unknown) {
  if (error instanceof MapValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof MapConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error && error.message.includes('SUPABASE_')) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const message = error instanceof Error ? error.message : 'Map request failed';
  return NextResponse.json({ error: message }, { status: 500 });
}

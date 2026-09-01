import { NextRequest, NextResponse } from 'next/server';
import { getAdminMapService } from '../_lib/mapService';
import { mapErrorResponse } from '../_lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await getAdminMapService().publishDraft({
      floorId: body.floorId,
      actorUserId: body.actorUserId ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    return mapErrorResponse(error);
  }
}

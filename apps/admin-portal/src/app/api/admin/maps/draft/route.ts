import { NextRequest, NextResponse } from 'next/server';
import { getAdminMapService } from '../_lib/mapService';
import { mapErrorResponse } from '../_lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const floorId = request.nextUrl.searchParams.get('floorId') ?? undefined;
    const draft = await getAdminMapService().loadDraft(floorId);
    return NextResponse.json({ draft });
  } catch (error) {
    return mapErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const draft = await getAdminMapService().saveDraft({
      floorId: body.floorId,
      canvasWidth: body.canvasWidth,
      canvasHeight: body.canvasHeight,
      gridSize: body.gridSize,
      elements: body.elements ?? [],
      actorUserId: body.actorUserId ?? null,
    });
    return NextResponse.json({ draft });
  } catch (error) {
    return mapErrorResponse(error);
  }
}

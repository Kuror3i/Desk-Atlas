import { NextRequest, NextResponse } from 'next/server';
import { getAdminMapService } from '../_lib/mapService';
import { mapErrorResponse } from '../_lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const floorId = request.nextUrl.searchParams.get('floorId') ?? undefined;
    const published = await getAdminMapService().loadPublished(floorId);
    return NextResponse.json({ published });
  } catch (error) {
    return mapErrorResponse(error);
  }
}

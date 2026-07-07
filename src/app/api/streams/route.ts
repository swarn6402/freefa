import { NextRequest, NextResponse } from 'next/server';
import { getStreamLinks, addStreamLink } from '@/lib/matchService';
import { jsonWithEdgeCache } from '@/lib/edgeCache';
import { StreamLink } from '@/types';

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get('matchId');
  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 });
  }

  return jsonWithEdgeCache(
    async () => ({ streams: await getStreamLinks(matchId) }),
    { key: req.url, ttlSeconds: 60, staleWhileRevalidateSeconds: 30 }
  );
}

export async function POST(req: NextRequest) {
  // Admin-only endpoint for adding stream links manually
  const secret = req.headers.get('x-api-secret');
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: Omit<StreamLink, 'id' | 'addedAt'> = await req.json();
    const link: StreamLink = {
      ...body,
      id: `manual_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    await addStreamLink(link);
    return NextResponse.json({ success: true, link });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

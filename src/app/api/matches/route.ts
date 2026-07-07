import { NextRequest, NextResponse } from 'next/server';
import { getAllMatches, getFinishedMatches, getMatchesWithStreams } from '@/lib/matchService';
import { jsonWithEdgeCache } from '@/lib/edgeCache';

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const limitParam = req.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? Number(limitParam) : undefined;
    const limit = parsedLimit && Number.isFinite(parsedLimit) ? parsedLimit : undefined;

    // Key on the real request URL (same origin/host as the Worker) so the
    // Cloudflare Cache API actually stores it. The clients send fixed URLs
    // (`/api/matches` and `/api/matches?status=FINISHED&limit=6`), so variants
    // cache independently without fragmentation.
    const cacheKey = req.url;

    return await jsonWithEdgeCache(
      async () => {
        const matches =
          status === 'FINISHED'
            ? await getFinishedMatches(limit ?? 6)
            : await getAllMatches();

        const withStreams = await getMatchesWithStreams(matches);
        return { matches: withStreams };
      },
      { key: cacheKey, ttlSeconds: 60, staleWhileRevalidateSeconds: 30 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

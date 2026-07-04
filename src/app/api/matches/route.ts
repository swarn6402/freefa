import { NextRequest, NextResponse } from 'next/server';
import { getAllMatches, getFinishedMatches, getMatchesWithStreams } from '@/lib/matchService';

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const limitParam = req.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? Number(limitParam) : undefined;
    const limit = parsedLimit && Number.isFinite(parsedLimit) ? parsedLimit : undefined;

    const matches =
      status === 'FINISHED'
        ? await getFinishedMatches(limit ?? 6)
        : await getAllMatches();

    const withStreams = await getMatchesWithStreams(matches);
    return NextResponse.json(
      { matches: withStreams },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
        }
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

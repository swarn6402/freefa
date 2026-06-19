import { NextResponse } from 'next/server';
import { MatchDataUnavailableError, getMatchById, getMatchWithStreams } from '@/lib/matchService';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const match = await getMatchById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    return NextResponse.json({ match: await getMatchWithStreams(match) });
  } catch (err) {
    if (err instanceof MatchDataUnavailableError) {
      return NextResponse.json({ error: 'Match data temporarily unavailable' }, { status: 503 });
    }

    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

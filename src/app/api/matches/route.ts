import { NextResponse } from 'next/server';
import { getAllMatches, getMatchesWithStreams } from '@/lib/matchService';

export async function GET() {
  try {
    const matches = await getAllMatches();
    const withStreams = await getMatchesWithStreams(matches);
    return NextResponse.json({ matches: withStreams });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

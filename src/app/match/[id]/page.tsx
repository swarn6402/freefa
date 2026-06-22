import { notFound } from 'next/navigation';
import { MatchDetailRecovery } from '@/components/match/MatchDetailRecovery';
import { MatchDetailView } from '@/components/match/MatchDetailView';
import { MatchDataUnavailableError, getMatchById, getMatchWithStreams } from '@/lib/matchService';

export const revalidate = 45;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let rawMatch;

  try {
    rawMatch = await getMatchById(id);
  } catch (error) {
    if (error instanceof MatchDataUnavailableError) {
      return <MatchDetailRecovery matchId={id} />;
    }

    throw error;
  }

  if (!rawMatch) {
    notFound();
  }

  const match = await getMatchWithStreams(rawMatch);
  return <MatchDetailView match={match} />;
}

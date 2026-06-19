'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Match } from '@/types';
import { MatchDetailView } from '@/components/match/MatchDetailView';

interface MatchResponse {
  match?: Match;
}

interface MatchDetailRecoveryProps {
  matchId: string;
}

const RETRY_INTERVAL_MS = 2500;

export function MatchDetailRecovery({ matchId }: MatchDetailRecoveryProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMatch() {
      try {
        const response = await fetch(`/api/matches/${matchId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Match fetch failed: ${response.status}`);
        }

        const data = (await response.json()) as MatchResponse;
        if (!cancelled && data.match) {
          setMatch(data.match);
        }
      } catch (error) {
        if (!cancelled) {
          setAttempts((current) => current + 1);
          console.warn('[MatchDetailRecovery] Waiting for match data:', error);
        }
      }
    }

    void loadMatch();
    const interval = window.setInterval(() => {
      void loadMatch();
    }, RETRY_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId]);

  if (match) {
    return <MatchDetailView match={match} />;
  }

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          {'<- Back to matches'}
        </Link>

        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 text-center sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wc-gold">
            Loading Match
          </p>
          <h1 className="mt-3 text-2xl font-black text-white">Fetching live data</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
            The match page is loading from the live API. This usually resolves automatically in a few seconds.
          </p>
          {attempts > 1 && (
            <p className="mt-3 text-xs text-zinc-600">
              Still trying...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

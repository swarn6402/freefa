'use client';

import { useEffect, useState } from 'react';
import { Match } from '@/types';
import { MatchSection } from '@/components/match/MatchSection';

interface MatchesResponse {
  matches: Match[];
}

const RESULTS_REFRESH_INTERVAL_MS = 60 * 1000;

export function RecentResultsFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        const response = await fetch('/api/matches', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load recent results: ${response.status}`);
        }

        const data = (await response.json()) as MatchesResponse;
        if (cancelled) {
          return;
        }

        const finishedMatches = (data.matches || [])
          .filter((match) => match.status === 'FINISHED')
          .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
          .slice(0, 6);

        setMatches(finishedMatches);
      } catch (error) {
        console.error('[RecentResultsFeed] Failed to fetch results:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadResults();
    const interval = window.setInterval(() => {
      void loadResults();
    }, RESULTS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (matches.length === 0) {
    return null;
  }

  return <MatchSection title="Results" icon="✅" matches={matches} cardVariant="home" tone="home" />;
}

function ResultsSkeleton() {
  return (
    <section className="rounded-[24px] border border-white/6 bg-zinc-950/55 px-4 py-4 backdrop-blur-sm md:rounded-[28px] md:px-6 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-800/80" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-800/70" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/80" />
              <div className="h-3 w-6 animate-pulse rounded bg-zinc-800/70" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-10 w-10 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
              </div>
              <div className="h-20 w-28 animate-pulse rounded-xl border border-white/6 bg-white/[0.03]" />
              <div className="flex flex-1 flex-col items-end gap-2">
                <div className="h-10 w-10 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
              </div>
            </div>
            <div className="mt-4 h-px bg-white/6" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-zinc-900/80" />
          </div>
        ))}
      </div>
    </section>
  );
}

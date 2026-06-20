'use client';

import { useEffect, useMemo, useState } from 'react';
import { Match } from '@/types';
import { MatchCard } from '@/components/match/MatchCard';

interface MatchesResponse {
  matches: Match[];
}

const SCHEDULE_REFRESH_INTERVAL_MS = 60 * 1000;
const DISPLAY_LOCALE = undefined;

export function ScheduleMatchesFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      try {
        const response = await fetch('/api/matches', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load schedule: ${response.status}`);
        }

        const data = (await response.json()) as MatchesResponse;
        if (!cancelled) {
          setMatches(data.matches || []);
        }
      } catch (error) {
        console.error('[ScheduleMatchesFeed] Failed to fetch schedule:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMatches();
    const interval = window.setInterval(() => {
      void loadMatches();
    }, SCHEDULE_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const sortedDates = useMemo(() => {
    const byDate = matches.reduce<Record<string, Match[]>>((acc, match) => {
      const dateKey = new Date(match.utcDate).toLocaleDateString(DISPLAY_LOCALE, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(match);
      return acc;
    }, {});

    return Object.entries(byDate).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 text-center text-sm text-zinc-500">
        No matches available right now.
      </div>
    );
  }

  return (
    <>
      {sortedDates.map(([date, dayMatches]) => (
        <section key={date}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-bold text-white md:text-base">{date}</h2>
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="shrink-0 text-xs text-zinc-600">
              {dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={sectionIndex}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-52 animate-pulse rounded bg-zinc-800/80" />
            <div className="h-px flex-1 bg-zinc-800" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/80" />
                  <div className="h-3 w-16 animate-pulse rounded bg-zinc-800/70" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-8 w-8 animate-pulse rounded bg-zinc-800/80" />
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
                  </div>
                  <div className="h-12 w-20 animate-pulse rounded-xl border border-white/6 bg-white/[0.03]" />
                  <div className="flex flex-1 flex-col items-end gap-2">
                    <div className="h-8 w-8 animate-pulse rounded bg-zinc-800/80" />
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
                  </div>
                </div>
                <div className="mt-3 h-px bg-zinc-800/60" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="h-3 w-24 animate-pulse rounded bg-zinc-900/80" />
                  <div className="h-4 w-14 animate-pulse rounded bg-zinc-800/70" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Match } from '@/types';
import { HeroMatch } from '@/components/match/HeroMatch';
import { MatchSection } from '@/components/match/MatchSection';

interface MatchesResponse {
  matches: Match[];
}

interface HomeFeedProps {
  initialMatch: Match | null;
}

// 60s aligns with the /api/matches edge-cache TTL: a client poll lands at most
// once per cache window, so even cache misses stay ~1 origin read/60s/POP.
// Live scores also refresh independently via ESPN, so 60s here is imperceptible.
const LIVE_POLL_INTERVAL_MS = 60 * 1000;
const IDLE_POLL_INTERVAL_MS = 3 * 60 * 1000;

export function HomeFeed({ initialMatch }: HomeFeedProps) {
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(initialMatch);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      try {
        const response = await fetch('/api/matches', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load matches: ${response.status}`);
        }

        const data = (await response.json()) as MatchesResponse;
        if (cancelled) return;

        const all = data.matches || [];
        const live = all.filter(
          (match) => match.status === 'LIVE' || match.status === 'HALF_TIME'
        );

        setLiveMatches(live);
        setFeaturedMatch(pickFeaturedMatch(all));
        setIsLoadingLive(false);

        // Adaptive interval: poll faster when live, slower when idle
        const nextInterval = live.length > 0 ? LIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS;
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
        }
        intervalRef.current = window.setInterval(() => {
          void loadMatches();
        }, nextInterval);
      } catch (error) {
        console.error('[HomeFeed] Failed to fetch matches:', error);
        if (!cancelled) {
          setLiveMatches([]);
          setIsLoadingLive(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Hero section — copied from FeaturedHeroFeed.tsx */}
      {featuredMatch && (
        <section className="relative z-10 -mt-12 pt-1 sm:-mt-16 md:-mt-28 md:pt-2">
          <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 sm:px-2">
            {featuredMatch.status === 'LIVE' || featuredMatch.status === 'HALF_TIME'
              ? 'Live Match'
              : featuredMatch.status === 'FINISHED'
                ? 'Latest Result'
                : 'Next Match'}
          </p>
          <HeroMatch match={featuredMatch} />
        </section>
      )}

      {/* Live matches section — copied from LiveMatchesFeed.tsx */}
      {isLoadingLive ? (
        <LiveMatchesSkeleton />
      ) : liveMatches.length > 0 ? (
        <MatchSection
          title="Live"
          icon="🔴"
          matches={liveMatches}
          cardVariant="home"
          tone="home"
        />
      ) : null}
    </>
  );
}

function LiveMatchesSkeleton() {
  return (
    <section className="rounded-[24px] border border-white/6 bg-zinc-950/55 px-4 py-4 backdrop-blur-sm md:rounded-[28px] md:px-6 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-5 w-28 animate-pulse rounded bg-zinc-800/80" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-800/70" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/80" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-zinc-800/70" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-10 w-10 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
              </div>
              <div className="h-16 w-24 animate-pulse rounded-xl border border-white/6 bg-white/[0.03]" />
              <div className="flex flex-1 flex-col items-end gap-2">
                <div className="h-10 w-10 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-900/80" />
              </div>
            </div>
            <div className="mt-4 h-px bg-white/6" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-900/80" />
              <div className="h-5 w-14 animate-pulse rounded bg-zinc-800/70" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function pickFeaturedMatch(matches: Match[]): Match | null {
  const liveMatches = matches.filter((match) => match.status === 'LIVE' || match.status === 'HALF_TIME');
  if (liveMatches.length > 0) {
    return liveMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
  }

  const upcomingMatches = matches
    .filter((match) => match.status === 'SCHEDULED' && new Date(match.utcDate) > new Date())
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  if (upcomingMatches.length > 0) {
    return upcomingMatches[0];
  }

  const finishedMatches = matches
    .filter((match) => match.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

  return finishedMatches[0] || null;
}

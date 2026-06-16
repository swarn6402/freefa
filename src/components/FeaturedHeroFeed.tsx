'use client';

import { useEffect, useState } from 'react';
import { Match } from '@/types';
import { HeroMatch } from '@/components/match/HeroMatch';

interface MatchesResponse {
  matches: Match[];
}

interface FeaturedHeroFeedProps {
  initialMatch: Match | null;
}

const HERO_REFRESH_INTERVAL_MS = 30 * 1000;

export function FeaturedHeroFeed({ initialMatch }: FeaturedHeroFeedProps) {
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(initialMatch);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedMatch() {
      try {
        const response = await fetch('/api/matches', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load featured match: ${response.status}`);
        }

        const data = (await response.json()) as MatchesResponse;
        if (cancelled) {
          return;
        }

        const nextMatch = pickFeaturedMatch(data.matches || []);
        setFeaturedMatch(nextMatch);
      } catch (error) {
        console.error('[FeaturedHeroFeed] Failed to fetch featured match:', error);
      }
    }

    void loadFeaturedMatch();
    const interval = window.setInterval(() => {
      void loadFeaturedMatch();
    }, HERO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!featuredMatch) {
    return null;
  }

  return (
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

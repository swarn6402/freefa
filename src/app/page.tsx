import Image from 'next/image';
import {
  getFeaturedMatch,
  getLiveMatches,
  getUpcomingMatches,
  getFinishedMatches,
  getMatchesWithStreams,
} from '@/lib/matchService';
import { getGroupStandings } from '@/lib/standingsService';
import { HeroMatch } from '@/components/match/HeroMatch';
import { MatchSection } from '@/components/match/MatchSection';
import { StandingsTable } from '@/components/match/StandingsTable';

export const revalidate = 30; // ISR - revalidate every 30s

export default async function HomePage() {
  const [featured, liveMatches, upcomingMatches, finishedMatches, standings] = await Promise.all([
    getFeaturedMatch(),
    getLiveMatches(),
    getUpcomingMatches(8),
    getFinishedMatches(6),
    getGroupStandings(),
  ]);

  const [featuredWithStreams, liveWithStreams, upcomingWithStreams, finishedWithStreams] =
    await Promise.all([
      featured ? getMatchesWithStreams([featured]).then((matches) => matches[0] || null) : Promise.resolve(null),
      getMatchesWithStreams(liveMatches),
      getMatchesWithStreams(upcomingMatches),
      getMatchesWithStreams(finishedMatches),
    ]);

  // Show only first 4 groups on homepage
  const homepageStandings = standings.slice(0, 4);

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        <section className="relative overflow-hidden rounded-[28px] min-h-[240px] md:min-h-[300px]">
          <Image
            src="/images/home-hero-stadium.png"
            alt="Night-time football stadium"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/88" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_36%)]" />

          <div className="relative z-10 flex min-h-[240px] md:min-h-[300px] flex-col justify-between px-5 py-6 md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-wc-gold/90">
                  Live Match Centre
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                  FreeFA
                </h1>
                <p className="mt-2 max-w-xl text-sm text-zinc-300 md:text-base">
                  World Cup 2026 fixtures, standings, venues, and live stream tracking in one place.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm">
                <span>Jun 11 - Jul 19, 2026</span>
              </div>
            </div>
          </div>
        </section>

        {featuredWithStreams && (
          <section className="-mt-24 relative z-10 pt-2 md:-mt-28">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              {liveWithStreams.length > 0 ? 'Live Match' : 'Next Match'}
            </p>
            <HeroMatch match={featuredWithStreams} />
          </section>
        )}

        {/* Live matches */}
        {liveWithStreams.length > 0 && (
          <MatchSection
            title="Live"
            icon="🔴"
            matches={liveWithStreams}
            cardVariant="home"
            tone="home"
          />
        )}

        {/* Upcoming */}
        <MatchSection
          title="Upcoming"
          icon="📅"
          matches={upcomingWithStreams}
          emptyMessage="No upcoming matches scheduled yet."
          cardVariant="home"
          tone="home"
        />

        {/* Standings preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span> Standings
            </h2>
            <a href="/standings" className="text-xs text-wc-gold hover:underline font-medium">
              View all groups →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {homepageStandings.map((s) => (
              <StandingsTable key={s.group} standing={s} />
            ))}
          </div>
        </section>

        {/* Recent results */}
        {finishedWithStreams.length > 0 && (
          <MatchSection
            title="Results"
            icon="✅"
            matches={finishedWithStreams}
            cardVariant="home"
            tone="home"
          />
        )}
      </div>
    </div>
  );
}

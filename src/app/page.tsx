import Image from 'next/image';
import { HomeFeed } from '@/components/HomeFeed';
import { RecentResultsFeed } from '@/components/RecentResultsFeed';
import { MatchSection } from '@/components/match/MatchSection';
import { StandingsTable } from '@/components/match/StandingsTable';
import { getFinishedMatches, getUpcomingMatches } from '@/lib/matchService';
import { getGroupStandings } from '@/lib/standingsService';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [upcomingMatches, finishedMatches, standings] = await Promise.all([
    getUpcomingMatches(9),
    getFinishedMatches(1),
    getGroupStandings(),
  ]);

  const featuredMatch = upcomingMatches[0] ?? finishedMatches[0] ?? null;
  const upcomingPreview =
    featuredMatch && featuredMatch.id === upcomingMatches[0]?.id
      ? upcomingMatches.slice(1, 9)
      : upcomingMatches.slice(0, 8);
  const homepageStandings = standings.slice(0, 4);

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 sm:py-6 lg:space-y-10 lg:px-8">
        <section className="relative min-h-[220px] overflow-hidden rounded-[24px] md:min-h-[300px] md:rounded-[28px]">
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

          <div className="relative z-10 flex min-h-[220px] flex-col justify-between px-4 py-5 sm:px-5 sm:py-6 md:min-h-[300px] md:px-8 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-wc-gold/90">
                  Live Match Centre
                </p>
                <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl md:mt-3 md:text-5xl">
                  FreeFA
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300 md:text-base">
                  World Cup 2026 fixtures, standings, venues, and live stream tracking in one place.
                </p>
                <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm md:hidden">
                  Jun 11 - Jul 19, 2026
                </div>
              </div>

              <div className="hidden items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm md:flex">
                <span>Jun 11 - Jul 19, 2026</span>
              </div>
            </div>
          </div>
        </section>

        <HomeFeed initialMatch={featuredMatch} />

        <MatchSection
          title="Upcoming"
          icon="📅"
          matches={upcomingPreview}
          emptyMessage="No upcoming matches scheduled yet."
          cardVariant="home"
          tone="home"
        />

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <span>📊</span> Standings
            </h2>
            <a href="/standings" className="shrink-0 text-xs font-medium text-wc-gold hover:underline">
              View all groups →
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {homepageStandings.map((standing) => (
              <StandingsTable key={standing.group} standing={standing} />
            ))}
          </div>
        </section>

        <RecentResultsFeed />
      </div>
    </div>
  );
}

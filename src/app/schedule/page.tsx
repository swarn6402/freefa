import { Match } from '@/types';
import { MatchCard } from '@/components/match/MatchCard';
import { getAllMatches } from '@/lib/matchService';

export const revalidate = 86400;

export const metadata = {
  title: 'Schedule | FreeFA',
};

export default async function SchedulePage() {
  const matches = await getAllMatches();

  const byDate = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const d = new Date(match.utcDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[d]) acc[d] = [];
    acc[d].push(match);
    return acc;
  }, {});

  const sortedDates = Object.entries(byDate).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 sm:py-6 lg:space-y-10 lg:px-8">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Schedule</h1>
          <p className="mt-1 text-sm text-zinc-500">{matches.length} matches · June 11 - July 19, 2026</p>
        </div>

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
      </div>
    </div>
  );
}

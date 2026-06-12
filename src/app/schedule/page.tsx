import { getAllMatches } from '@/lib/matchService';
import { MatchCard } from '@/components/match/MatchCard';
import { Match } from '@/types';

export const revalidate = 60;

export const metadata = {
  title: 'Schedule | FreeFA',
};

export default async function SchedulePage() {
  const matches = await getAllMatches();

  // Group by date
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        <div>
          <h1 className="text-2xl font-black text-white">Schedule</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {matches.length} matches · June 11 - July 19, 2026
          </p>
        </div>

        {sortedDates.map(([date, dayMatches]) => (
          <section key={date}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-bold text-white">{date}</h2>
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">
                {dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

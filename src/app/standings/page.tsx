import { getGroupStandings } from '@/lib/standingsService';
import { StandingsTable } from '@/components/match/StandingsTable';

export const metadata = {
  title: 'Standings | FreeFA',
};

export const revalidate = 30;

export default async function StandingsPage() {
  const standings = await getGroupStandings();

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Standings</h1>
          <p className="text-sm text-zinc-500 mt-1">Live tables across all 12 groups</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {standings.map((s) => (
            <StandingsTable key={s.group} standing={s} />
          ))}
        </div>

        <div className="mt-6 text-xs text-zinc-600 text-center">
          Top 2 teams from each group + 8 best 3rd-place teams advance to Round of 32
        </div>
      </div>
    </div>
  );
}

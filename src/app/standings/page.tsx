import { StandingsTable } from '@/components/match/StandingsTable';
import { getGroupStandings } from '@/lib/standingsService';

export const metadata = {
  title: 'Standings | FreeFA',
};

export const revalidate = 3600;

export default async function StandingsPage() {
  const standings = await getGroupStandings();

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white md:text-3xl">Standings</h1>
          <p className="mt-1 text-sm text-zinc-500">Live tables across all 12 groups</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {standings.map((s) => (
            <StandingsTable key={s.group} standing={s} />
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-zinc-600">
          Top 2 teams from each group + 8 best 3rd-place teams advance to Round of 32
        </div>
      </div>
    </div>
  );
}

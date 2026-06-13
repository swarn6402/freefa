import { GroupStanding } from '@/types';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface StandingsTableProps {
  standing: GroupStanding;
}

export function StandingsTable({ standing }: StandingsTableProps) {
  const sorted = [...standing.entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2.5">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-wc-gold">
          Group {standing.group}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] text-xs">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="w-6 px-3 py-2 text-left font-medium text-zinc-600">#</th>
              <th className="px-2 py-2 text-left font-medium text-zinc-600">Team</th>
              <th className="px-2 py-2 text-center font-medium text-zinc-600">P</th>
              <th className="hidden px-2 py-2 text-center font-medium text-zinc-600 sm:table-cell">W</th>
              <th className="hidden px-2 py-2 text-center font-medium text-zinc-600 sm:table-cell">D</th>
              <th className="hidden px-2 py-2 text-center font-medium text-zinc-600 sm:table-cell">L</th>
              <th className="px-2 py-2 text-center font-medium text-zinc-600">GD</th>
              <th className="px-2 py-2 text-center font-black text-zinc-400">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, idx) => (
              <tr
                key={entry.team.id}
                className="border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-3 py-2.5 font-mono text-zinc-600">{idx + 1}</td>
                <td className="px-2 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FlagIcon
                      flag={entry.team.flag}
                      teamName={entry.team.name}
                      size={18}
                      className="h-[18px] w-[18px] flex-none"
                    />
                    <span className="truncate font-medium text-white">{entry.team.shortName}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-zinc-400">{entry.played}</td>
                <td className="hidden px-2 py-2.5 text-center text-zinc-400 sm:table-cell">{entry.won}</td>
                <td className="hidden px-2 py-2.5 text-center text-zinc-400 sm:table-cell">{entry.drawn}</td>
                <td className="hidden px-2 py-2.5 text-center text-zinc-400 sm:table-cell">{entry.lost}</td>
                <td className="px-2 py-2.5 text-center text-zinc-400">
                  {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className="font-black text-white">{entry.points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

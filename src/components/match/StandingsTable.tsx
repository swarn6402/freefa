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
    <div className="rounded-xl border border-zinc-800/60 overflow-hidden bg-zinc-900/50">
      {/* Header */}
      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-black tracking-widest uppercase text-wc-gold">
          Group {standing.group}
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800/60">
            <th className="text-left px-3 py-2 text-zinc-600 font-medium w-6">#</th>
            <th className="text-left px-2 py-2 text-zinc-600 font-medium">Team</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium">P</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium">W</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium">D</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium">L</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium">GD</th>
            <th className="text-center px-2 py-2 text-zinc-600 font-medium font-black text-zinc-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => (
            <tr
              key={entry.team.id}
              className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors"
            >
              <td className="px-3 py-2 text-zinc-600 font-mono">{idx + 1}</td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-1.5">
                  <FlagIcon
                    flag={entry.team.flag}
                    teamName={entry.team.name}
                    size={18}
                    className="h-[18px] w-[18px] flex-none"
                  />
                  <span className="text-white font-medium truncate max-w-[80px]">
                    {entry.team.shortName}
                  </span>
                </div>
              </td>
              <td className="px-2 py-2 text-center text-zinc-400">{entry.played}</td>
              <td className="px-2 py-2 text-center text-zinc-400">{entry.won}</td>
              <td className="px-2 py-2 text-center text-zinc-400">{entry.drawn}</td>
              <td className="px-2 py-2 text-center text-zinc-400">{entry.lost}</td>
              <td className="px-2 py-2 text-center text-zinc-400">
                {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
              </td>
              <td className="px-2 py-2 text-center">
                <span className="font-black text-white">{entry.points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

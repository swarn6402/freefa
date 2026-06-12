import { Match } from '@/types';
import { MatchCard } from './MatchCard';

interface MatchSectionProps {
  title: string;
  icon?: string;
  matches: Match[];
  emptyMessage?: string;
}

export function MatchSection({ title, icon, matches, emptyMessage }: MatchSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        <span className="text-xs text-zinc-500 font-medium">
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 text-center text-zinc-500 text-sm">
          {emptyMessage || 'No matches to display'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}

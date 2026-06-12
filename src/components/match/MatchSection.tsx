import { Match } from '@/types';
import { MatchCard } from './MatchCard';

interface MatchSectionProps {
  title: string;
  icon?: string;
  matches: Match[];
  emptyMessage?: string;
  cardVariant?: 'default' | 'compact' | 'featured' | 'home';
  tone?: 'default' | 'home';
}

export function MatchSection({
  title,
  icon,
  matches,
  emptyMessage,
  cardVariant = 'default',
  tone = 'default',
}: MatchSectionProps) {
  const isHomeTone = tone === 'home';

  return (
    <section className={isHomeTone ? 'rounded-[28px] border border-white/6 bg-zinc-950/55 px-5 py-5 backdrop-blur-sm md:px-6 md:py-6' : ''}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={isHomeTone ? 'text-base font-black uppercase tracking-[0.18em] text-white flex items-center gap-2' : 'text-lg font-bold text-white flex items-center gap-2'}>
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        <span className={isHomeTone ? 'rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400 font-medium' : 'text-xs text-zinc-500 font-medium'}>
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 text-center text-zinc-500 text-sm">
          {emptyMessage || 'No matches to display'}
        </div>
      ) : (
        <div className={isHomeTone ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'}>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} variant={cardVariant} />
          ))}
        </div>
      )}
    </section>
  );
}

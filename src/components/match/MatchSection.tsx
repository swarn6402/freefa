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
    <section
      className={
        isHomeTone
          ? 'rounded-[24px] border border-white/6 bg-zinc-950/55 px-4 py-4 backdrop-blur-sm md:rounded-[28px] md:px-6 md:py-6'
          : ''
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          className={
            isHomeTone
              ? 'flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white md:text-base'
              : 'flex items-center gap-2 text-lg font-bold text-white'
          }
        >
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        <span
          className={
            isHomeTone
              ? 'shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-zinc-400'
              : 'shrink-0 text-xs font-medium text-zinc-500'
          }
        >
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 text-center text-sm text-zinc-500">
          {emptyMessage || 'No matches to display'}
        </div>
      ) : (
        <div
          className={
            isHomeTone
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'
              : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }
        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} variant={cardVariant} />
          ))}
        </div>
      )}
    </section>
  );
}

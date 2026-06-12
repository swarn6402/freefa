import { Match } from '@/types';
import { cn, getMatchMinuteDisplay } from '@/lib/utils';
import { LiveBadge } from '@/components/ui/LiveBadge';

interface ScoreDisplayProps {
  match: Match;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ match, size = 'md' }: ScoreDisplayProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isFinished = match.status === 'FINISHED';
  const isScheduled = match.status === 'SCHEDULED';

  const scoreClasses = cn(
    'font-display font-black tabular-nums tracking-tight',
    size === 'lg' && 'text-5xl',
    size === 'md' && 'text-3xl',
    size === 'sm' && 'text-xl'
  );

  if (isScheduled) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn('text-wc-gold font-bold', size === 'sm' ? 'text-base' : 'text-xl')}>
          vs
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <span className={cn(scoreClasses, isLive ? 'text-white' : 'text-zinc-300')}>
          {match.score.home ?? 0}
        </span>
        <span className={cn('text-zinc-500', size === 'sm' ? 'text-lg' : 'text-2xl')}>-</span>
        <span className={cn(scoreClasses, isLive ? 'text-white' : 'text-zinc-300')}>
          {match.score.away ?? 0}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {isLive && <LiveBadge size="sm" />}
        {match.status === 'HALF_TIME' && (
          <span className="text-[10px] font-bold text-orange-400 tracking-widest">HALF TIME</span>
        )}
        {isFinished && (
          <span className="text-[10px] font-bold text-zinc-500 tracking-widest">FULL TIME</span>
        )}
        {isLive && match.minute && (
          <span className="text-[10px] text-red-400 font-mono">{match.minute}&apos;</span>
        )}
      </div>
    </div>
  );
}

export function MinuteDisplay({ match }: { match: Match }) {
  return (
    <span className="text-sm font-mono text-zinc-400">
      {getMatchMinuteDisplay(match)}
    </span>
  );
}

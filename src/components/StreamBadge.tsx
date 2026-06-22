import { cn } from '@/lib/utils';

interface StreamBadgeProps {
  matchId: string;
  initialCount?: number;
  className?: string;
  emptyLabel?: string;
}

// Presentational only: stream counts arrive embedded in the match payload
// (getMatchesWithStreams), so the parent feeds already keep this fresh on their
// own refresh cadence. Polling per-card here previously caused thousands of
// uncached /api/streams requests/hour (104 cards on /schedule alone).
export function StreamBadge({
  initialCount = 0,
  className,
  emptyLabel = 'Watch',
}: StreamBadgeProps) {
  const hasStreams = initialCount > 0;
  const count = initialCount;

  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-[10px] font-bold',
        hasStreams
          ? 'bg-wc-gold/20 text-wc-gold'
          : 'border border-white/8 bg-white/[0.06] text-zinc-500',
        className
      )}
    >
      {hasStreams ? `Watch ${count}` : emptyLabel}
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { StreamLink } from '@/types';

interface StreamsResponse {
  streams: StreamLink[];
}

interface StreamBadgeProps {
  matchId: string;
  initialCount?: number;
  className?: string;
  emptyLabel?: string;
}

const STREAM_REFRESH_INTERVAL_MS = 30 * 1000;

export function StreamBadge({
  matchId,
  initialCount = 0,
  className,
  emptyLabel = 'Watch',
}: StreamBadgeProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    async function loadStreams() {
      try {
        const response = await fetch(`/api/streams?matchId=${encodeURIComponent(matchId)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to load streams for match ${matchId}: ${response.status}`);
        }

        const data = (await response.json()) as StreamsResponse;
        if (!cancelled) {
          setCount(data.streams?.length || 0);
        }
      } catch (error) {
        console.error('[StreamBadge] Failed to fetch stream count:', error);
      }
    }

    void loadStreams();
    const interval = window.setInterval(() => {
      void loadStreams();
    }, STREAM_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId]);

  const hasStreams = count > 0;

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

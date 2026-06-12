'use client';

import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function LiveBadge({ className, size = 'md' }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold tracking-widest uppercase',
        size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5',
        'bg-red-600 text-white rounded-sm',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      LIVE
    </span>
  );
}

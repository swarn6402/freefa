'use client';

import { useState, useEffect } from 'react';
import { getCountdown } from '@/lib/utils';

interface CountdownTimerProps {
  utcDate: string;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ utcDate, className, onExpire }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(getCountdown(utcDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getCountdown(utcDate);
      setCountdown(next);
      if (next === 'Now') {
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [utcDate, onExpire]);

  return <span className={className}>{countdown}</span>;
}

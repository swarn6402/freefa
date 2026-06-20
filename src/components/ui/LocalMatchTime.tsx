"use client";

interface LocalMatchTimeProps {
  utcDate: string;
  className?: string;
}

function formatLocalMatchTime(utcDate: string): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime()) || typeof window === "undefined") {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function LocalMatchTime({ utcDate, className }: LocalMatchTimeProps) {
  return (
    <time dateTime={utcDate} className={className} suppressHydrationWarning>
      {formatLocalMatchTime(utcDate)}
    </time>
  );
}

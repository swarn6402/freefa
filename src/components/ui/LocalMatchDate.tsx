"use client";

type DateVariant = "short" | "long";

interface LocalMatchDateProps {
  utcDate: string;
  variant?: DateVariant;
  className?: string;
}

function formatLocalMatchDate(utcDate: string, variant: DateVariant): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime()) || typeof window === "undefined") {
    return "";
  }

  const options: Intl.DateTimeFormatOptions =
    variant === "long"
      ? {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      : {
          weekday: "short",
          month: "short",
          day: "numeric",
        };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function LocalMatchDate({
  utcDate,
  variant = "short",
  className,
}: LocalMatchDateProps) {
  return (
    <time dateTime={utcDate} className={className} suppressHydrationWarning>
      {formatLocalMatchDate(utcDate, variant)}
    </time>
  );
}

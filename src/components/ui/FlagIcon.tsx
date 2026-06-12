import { cn } from '@/lib/utils';

interface FlagIconProps {
  flag: string;
  teamName: string;
  className?: string;
  size?: number;
}

function getTwemojiCodepoints(flag: string): string {
  return Array.from(flag)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter((codepoint): codepoint is string => Boolean(codepoint))
    .join('-');
}

export function FlagIcon({ flag, teamName, className, size = 40 }: FlagIconProps) {
  const src = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${getTwemojiCodepoints(flag)}.svg`;

  return (
    <img
      src={src}
      alt={`${teamName} flag`}
      width={size}
      height={size}
      className={cn('inline-block object-contain', className)}
    />
  );
}

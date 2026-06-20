import Link from 'next/link';
import { Match } from '@/types';
import {
  cn,
  formatGroupName,
  formatMatchLocation,
  getStageName,
} from '@/lib/utils';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { LocalMatchDate } from '@/components/ui/LocalMatchDate';
import { LocalMatchTime } from '@/components/ui/LocalMatchTime';
import { StreamBadge } from '@/components/StreamBadge';
import { ScoreDisplay } from './ScoreDisplay';

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact' | 'featured' | 'home';
}

export function MatchCard({ match, variant = 'default' }: MatchCardProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';
  const hasStreams = (match.streams?.length || 0) > 0;
  const isHomeVariant = variant === 'home';

  return (
    <Link href={`/match/${match.id}`} className="block group">
      <article
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          isHomeVariant
            ? 'rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
            : 'rounded-xl border bg-gradient-to-b from-zinc-900 to-zinc-950',
          'hover:-translate-y-0.5 hover:border-wc-gold/50 hover:shadow-lg hover:shadow-wc-gold/10',
          isLive ? 'border-red-600/60 shadow-md shadow-red-900/30' : 'border-zinc-800/60',
          variant === 'compact' ? 'p-3' : isHomeVariant ? 'p-4 sm:p-[18px]' : 'p-4'
        )}
      >
        {isHomeVariant && (
          <>
            <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_72%)]" />
            <div className="absolute -left-10 top-14 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.11),transparent_68%)] blur-2xl" />
            <div className="absolute -right-10 top-14 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.09),transparent_70%)] blur-2xl" />
            <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </>
        )}

        {isLive && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent" />}

        <div className={cn('relative z-10 mb-3 flex items-start justify-between gap-2', isHomeVariant && 'mb-4')}>
          <span
            className={cn(
              'pr-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500',
              isHomeVariant && 'text-zinc-400'
            )}
          >
            {match.group ? formatGroupName(match.group) : getStageName(match.stage)}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            {isLive && <LiveBadge size="sm" />}
            {isScheduled && (
              <span
                className={cn(
                  'text-[10px] font-mono text-zinc-500',
                  isHomeVariant && 'rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 text-zinc-300'
                )}
              >
                <LocalMatchDate utcDate={match.utcDate} />
              </span>
            )}
            {isFinished && <span className="text-[10px] font-bold tracking-wider text-zinc-600">FT</span>}
          </div>
        </div>

        <div className={cn('relative z-10 flex items-center justify-between gap-3', isHomeVariant && 'gap-4')}>
          <TeamCell team={match.homeTeam} align="left" isHomeVariant={isHomeVariant} />

          <div
            className={cn(
              'flex-none px-1.5 text-center',
              isHomeVariant && 'min-w-[90px] rounded-xl border border-white/6 bg-white/[0.03] px-2 py-3'
            )}
          >
            <ScoreDisplay match={match} size="sm" />
            {isScheduled && (
              <div className="mt-1 text-[11px] font-bold text-wc-gold">
                <LocalMatchTime utcDate={match.utcDate} />
              </div>
            )}
          </div>

          <TeamCell team={match.awayTeam} align="right" isHomeVariant={isHomeVariant} />
        </div>

        {variant !== 'compact' && (
          <div
            className={cn(
              'relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-3',
              isHomeVariant && 'mt-4 border-white/6'
            )}
          >
            <span className={cn('min-w-0 truncate text-[10px]', isHomeVariant ? 'text-zinc-500' : 'text-zinc-600')}>
              {formatMatchLocation(match)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {isScheduled && (
                <span
                  className={cn(
                    'whitespace-nowrap text-[10px] font-bold text-wc-gold',
                    isHomeVariant && 'text-[11px]'
                  )}
                >
                  <CountdownTimer utcDate={match.utcDate} />
                </span>
              )}

              {(isLive || isScheduled) && (
                isHomeVariant ? (
                  <StreamBadge matchId={match.id} initialCount={match.streams?.length || 0} />
                ) : (
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-bold',
                      hasStreams ? 'bg-wc-gold/20 text-wc-gold' : 'bg-zinc-800 text-zinc-600'
                    )}
                  >
                    {hasStreams ? `Watch ${match.streams!.length}` : 'Watch'}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}

function TeamCell({
  team,
  align,
  isHomeVariant,
}: {
  team: Match['homeTeam'];
  align: 'left' | 'right';
  isHomeVariant: boolean;
}) {
  const alignmentClass = align === 'right' ? 'items-end text-right' : 'items-start text-left';

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col', alignmentClass)}>
      <FlagIcon
        flag={team.flag}
        teamName={team.name}
        size={isHomeVariant ? 40 : 32}
        className={cn('mb-2', isHomeVariant ? 'h-10 w-10' : 'h-8 w-8')}
      />
      <span
        className={cn(
          'max-w-full truncate font-bold leading-tight text-white',
          isHomeVariant ? 'text-sm sm:text-[15px]' : 'text-sm'
        )}
      >
        {team.shortName}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-500">{team.tla}</span>
    </div>
  );
}

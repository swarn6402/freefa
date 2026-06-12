import Link from 'next/link';
import { Match } from '@/types';
import { cn, formatGroupName, formatMatchDate, formatMatchLocation, formatMatchTime, getStageName } from '@/lib/utils';
import { ScoreDisplay } from './ScoreDisplay';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { FlagIcon } from '@/components/ui/FlagIcon';

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
          'hover:border-wc-gold/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-wc-gold/10',
          isLive
            ? 'border-red-600/60 shadow-md shadow-red-900/30'
            : 'border-zinc-800/60',
          variant === 'compact' ? 'p-3' : isHomeVariant ? 'p-4 md:p-[18px]' : 'p-4'
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

        {/* Live glow overlay */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
        )}

        {/* Stage & Group badge */}
        <div className={cn('relative z-10 flex items-center justify-between mb-3', isHomeVariant && 'mb-4')}>
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-widest text-zinc-500',
              isHomeVariant && 'text-zinc-400'
            )}
          >
            {match.group ? formatGroupName(match.group) : getStageName(match.stage)}
          </span>
          {isLive && <LiveBadge size="sm" />}
          {isScheduled && (
            <span
              className={cn(
                'text-[10px] text-zinc-500 font-mono',
                isHomeVariant && 'rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 text-zinc-300'
              )}
            >
              {formatMatchDate(match.utcDate)}
            </span>
          )}
          {isFinished && (
            <span className="text-[10px] font-bold tracking-wider text-zinc-600">FT</span>
          )}
        </div>

        {/* Teams + Score */}
        <div className={cn('relative z-10 flex items-center justify-between gap-2', isHomeVariant && 'gap-3')}>
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-start min-w-0">
            <FlagIcon
              flag={match.homeTeam.flag}
              teamName={match.homeTeam.name}
              size={isHomeVariant ? 40 : 32}
              className={cn('mb-1', isHomeVariant ? 'h-10 w-10' : 'h-8 w-8')}
            />
            <span className={cn('font-bold text-white truncate max-w-full leading-tight', isHomeVariant ? 'text-[15px]' : 'text-sm')}>
              {match.homeTeam.shortName}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {match.homeTeam.tla}
            </span>
          </div>

          {/* Score / Kickoff */}
          <div className={cn('flex-none text-center px-2', isHomeVariant && 'rounded-xl border border-white/6 bg-white/[0.03] py-3')}>
            <ScoreDisplay match={match} size="sm" />
            {isScheduled && (
              <div className="mt-1 text-[11px] text-wc-gold font-mono font-bold">
                {formatMatchTime(match.utcDate)}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-end min-w-0">
            <FlagIcon
              flag={match.awayTeam.flag}
              teamName={match.awayTeam.name}
              size={isHomeVariant ? 40 : 32}
              className={cn('mb-1', isHomeVariant ? 'h-10 w-10' : 'h-8 w-8')}
            />
            <span className={cn('font-bold text-white truncate max-w-full leading-tight text-right', isHomeVariant ? 'text-[15px]' : 'text-sm')}>
              {match.awayTeam.shortName}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {match.awayTeam.tla}
            </span>
          </div>
        </div>

        {/* Venue */}
        {variant !== 'compact' && (
          <div className={cn('relative z-10 mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between', isHomeVariant && 'mt-4 border-white/6')}>
            <span className={cn('text-[10px] truncate', isHomeVariant ? 'text-zinc-500' : 'text-zinc-600')}>
              📍 {formatMatchLocation(match)}
            </span>

            {isScheduled && (
              <span className={cn('text-[10px] text-wc-gold font-mono font-bold whitespace-nowrap', isHomeVariant && 'text-[11px]')}>
                <CountdownTimer utcDate={match.utcDate} />
              </span>
            )}

            {(isLive || isScheduled) && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  hasStreams
                    ? 'bg-wc-gold/20 text-wc-gold'
                    : isHomeVariant
                      ? 'border border-white/8 bg-white/[0.06] text-zinc-500'
                      : 'bg-zinc-800 text-zinc-600'
                )}
              >
                {hasStreams ? `▶ ${match.streams!.length} stream${match.streams!.length > 1 ? 's' : ''}` : '▶ Watch'}
              </span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}

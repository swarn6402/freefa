import Link from 'next/link';
import { Match } from '@/types';
import { cn, formatGroupName, formatMatchDate, formatMatchLocation, formatMatchTime, getStageName } from '@/lib/utils';
import { ScoreDisplay } from './ScoreDisplay';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact' | 'featured';
}

export function MatchCard({ match, variant = 'default' }: MatchCardProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';
  const hasStreams = (match.streams?.length || 0) > 0;

  return (
    <Link href={`/match/${match.id}`} className="block group">
      <article
        className={cn(
          'relative rounded-xl border overflow-hidden transition-all duration-300',
          'bg-gradient-to-b from-zinc-900 to-zinc-950',
          'hover:border-wc-gold/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-wc-gold/10',
          isLive
            ? 'border-red-600/60 shadow-md shadow-red-900/30'
            : 'border-zinc-800/60',
          variant === 'compact' ? 'p-3' : 'p-4'
        )}
      >
        {/* Live glow overlay */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
        )}

        {/* Stage & Group badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {match.group ? formatGroupName(match.group) : getStageName(match.stage)}
          </span>
          {isLive && <LiveBadge size="sm" />}
          {isScheduled && (
            <span className="text-[10px] text-zinc-500 font-mono">
              {formatMatchDate(match.utcDate)}
            </span>
          )}
          {isFinished && (
            <span className="text-[10px] font-bold tracking-wider text-zinc-600">FT</span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-start min-w-0">
            <FlagIcon
              flag={match.homeTeam.flag}
              teamName={match.homeTeam.name}
              size={32}
              className="mb-1 h-8 w-8"
            />
            <span className="font-bold text-sm text-white truncate max-w-full leading-tight">
              {match.homeTeam.shortName}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {match.homeTeam.tla}
            </span>
          </div>

          {/* Score / Kickoff */}
          <div className="flex-none text-center px-2">
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
              size={32}
              className="mb-1 h-8 w-8"
            />
            <span className="font-bold text-sm text-white truncate max-w-full leading-tight text-right">
              {match.awayTeam.shortName}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {match.awayTeam.tla}
            </span>
          </div>
        </div>

        {/* Venue */}
        {variant !== 'compact' && (
          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 truncate">
              📍 {formatMatchLocation(match)}
            </span>

            {isScheduled && (
              <span className="text-[10px] text-wc-gold font-mono font-bold whitespace-nowrap">
                <CountdownTimer utcDate={match.utcDate} />
              </span>
            )}

            {(isLive || isScheduled) && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  hasStreams
                    ? 'bg-wc-gold/20 text-wc-gold'
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

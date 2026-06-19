import Link from 'next/link';
import { Match } from '@/types';
import {
  cn,
  formatMatchDate,
  formatMatchStage,
  formatMatchTime,
  formatVenueName,
  getMatchMinuteDisplay,
} from '@/lib/utils';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { LiveBadge } from '@/components/ui/LiveBadge';

interface HeroMatchProps {
  match: Match;
}

export function HeroMatch({ match }: HeroMatchProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';
  const hasStreams = (match.streams?.length || 0) > 0;
  const minuteDisplay = getMatchMinuteDisplay(match);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800/80 md:rounded-[28px]">
      <div
        className={cn(
          'absolute inset-0',
          isLive
            ? 'bg-gradient-to-br from-red-950/60 via-zinc-950 to-zinc-950'
            : 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black'
        )}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_68%)]" />
      <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10),transparent_68%)] blur-3xl" />
      <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.08),transparent_70%)] blur-3xl" />
      <div className="absolute inset-x-12 bottom-0 h-28 bg-[radial-gradient(ellipse_at_bottom,rgba(201,168,76,0.10),transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div
        className={cn(
          'absolute left-0 right-0 top-0 h-0.5',
          isLive
            ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
            : 'bg-gradient-to-r from-transparent via-wc-gold/60 to-transparent'
        )}
      />

      <div className="relative z-10 px-4 py-5 sm:px-5 sm:py-6 md:px-10 md:py-12">
        <div className="mb-6 flex items-start justify-between gap-4 md:mb-8">
          <div className="flex min-w-0 items-center gap-2">
            {isLive && <LiveBadge />}
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 md:text-xs md:tracking-widest">
              {formatMatchStage(match)}
            </span>
          </div>
          <div className="shrink-0 text-right">
            {isLive && minuteDisplay && (
              <span className="text-sm font-bold text-red-400">{minuteDisplay}</span>
            )}
            {isFinished && (
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Full Time
              </span>
            )}
            {isScheduled && <span className="text-[11px] text-zinc-500">{formatMatchDate(match.utcDate)}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:flex md:items-center md:justify-between md:gap-8">
          <TeamBlock team={match.homeTeam} align="center" />

          <div className="flex flex-col items-center rounded-2xl border border-white/6 bg-white/[0.03] px-5 py-4 backdrop-blur-[2px] md:min-w-[200px] md:px-6">
            {isScheduled ? (
              <>
                <div className="text-4xl font-black text-wc-gold md:text-5xl">vs</div>
                <div className="mt-1 text-center">
                  <p className="text-base font-bold text-white md:text-lg">
                    {formatMatchTime(match.utcDate)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{formatVenueName(match.venue)}</p>
                  <p className="mt-3 font-mono text-2xl font-black text-wc-gold md:text-3xl">
                    <CountdownTimer utcDate={match.utcDate} />
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="tabular-nums text-5xl font-black text-white md:text-7xl">
                    {match.score.home ?? 0}
                  </span>
                  <span className="text-2xl text-zinc-600">-</span>
                  <span className="tabular-nums text-5xl font-black text-white md:text-7xl">
                    {match.score.away ?? 0}
                  </span>
                </div>
                {match.status === 'HALF_TIME' && (
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
                    Half Time
                  </span>
                )}
                <p className="mt-2 text-center text-xs text-zinc-500">{formatVenueName(match.venue)}</p>
              </>
            )}
          </div>

          <TeamBlock team={match.awayTeam} align="center" />
        </div>

        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:mt-8">
          <Link
            href={`/match/${match.id}`}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all',
              isLive || hasStreams
                ? 'bg-wc-gold text-black shadow-lg shadow-wc-gold/30 hover:bg-wc-gold/90'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            )}
          >
            {isLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Watch Live
              </>
            ) : isScheduled ? (
              <>Match Details</>
            ) : (
              <>Full Recap</>
            )}
          </Link>

          {isLive && !hasStreams && <span className="text-center text-xs text-zinc-500">Stream links updating...</span>}
          {hasStreams && (
            <span className="text-center text-xs font-medium text-wc-gold/70">
              {match.streams!.length} stream{match.streams!.length > 1 ? 's' : ''} available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamBlock({
  team,
  align,
}: {
  team: Match['homeTeam'];
  align: 'center';
}) {
  void align;

  return (
    <div className="flex flex-col items-center gap-3 md:flex-1">
      <FlagIcon
        flag={team.flag}
        teamName={team.name}
        size={128}
        className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32"
      />
      <div className="text-center">
        <p className="text-xl font-black leading-tight text-white md:text-3xl">{team.name}</p>
        <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{team.tla}</p>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Match } from '@/types';
import { cn, formatMatchDate, formatMatchStage, formatMatchTime, formatVenueName } from '@/lib/utils';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface HeroMatchProps {
  match: Match;
}

export function HeroMatch({ match }: HeroMatchProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';
  const hasStreams = (match.streams?.length || 0) > 0;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800/80">
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0',
          isLive
            ? 'bg-gradient-to-br from-red-950/60 via-zinc-950 to-zinc-950'
            : 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black'
        )}
      />

      {/* Internal atmosphere */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,#ffffff_0%,transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_68%)]" />
      <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10),transparent_68%)] blur-3xl" />
      <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.08),transparent_70%)] blur-3xl" />
      <div className="absolute inset-x-12 bottom-0 h-28 bg-[radial-gradient(ellipse_at_bottom,rgba(201,168,76,0.10),transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      {/* Gold top border for live */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      )}
      {!isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-wc-gold/60 to-transparent" />
      )}

      <div className="relative z-10 px-6 py-8 md:px-10 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {isLive && <LiveBadge />}
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {formatMatchStage(match)}
            </span>
          </div>
          {isLive && match.minute && (
            <span className="text-sm font-mono text-red-400 font-bold">{match.minute}&apos;</span>
          )}
          {isFinished && (
            <span className="text-xs font-bold tracking-widest text-zinc-500">FULL TIME</span>
          )}
          {isScheduled && (
            <span className="text-xs text-zinc-500">{formatMatchDate(match.utcDate)}</span>
          )}
        </div>

        {/* Main match display */}
        <div className="relative flex items-center justify-between gap-4 md:gap-8">
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-44 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-2xl md:block" />

          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <FlagIcon
              flag={match.homeTeam.flag}
              teamName={match.homeTeam.name}
              size={128}
              className="h-24 w-24 md:h-32 md:w-32"
            />
            <div className="text-center">
              <p className="font-black text-white text-lg md:text-2xl leading-tight">
                {match.homeTeam.name}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                {match.homeTeam.tla}
              </p>
            </div>
          </div>

          {/* Center score / vs */}
          <div className="flex-none flex flex-col items-center gap-2 min-w-[120px] rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-4 backdrop-blur-[2px] md:min-w-[180px]">
            {isScheduled ? (
              <>
                <div className="text-4xl md:text-5xl font-black text-wc-gold">vs</div>
                <div className="text-center">
                  <p className="text-sm md:text-base font-bold text-white">
                    {formatMatchTime(match.utcDate)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">📍 {formatVenueName(match.venue)}</p>
                  <p className="text-xl md:text-2xl font-black text-wc-gold mt-3 font-mono">
                    <CountdownTimer utcDate={match.utcDate} />
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-5xl md:text-7xl font-black text-white tabular-nums">
                    {match.score.home ?? 0}
                  </span>
                  <span className="text-2xl text-zinc-600">—</span>
                  <span className="text-5xl md:text-7xl font-black text-white tabular-nums">
                    {match.score.away ?? 0}
                  </span>
                </div>
                {match.status === 'HALF_TIME' && (
                  <span className="text-xs font-bold tracking-widest text-orange-400">HALF TIME</span>
                )}
                <p className="text-xs text-zinc-500 mt-1">📍 {formatVenueName(match.venue)}</p>
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <FlagIcon
              flag={match.awayTeam.flag}
              teamName={match.awayTeam.name}
              size={128}
              className="h-24 w-24 md:h-32 md:w-32"
            />
            <div className="text-center">
              <p className="font-black text-white text-lg md:text-2xl leading-tight">
                {match.awayTeam.name}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                {match.awayTeam.tla}
              </p>
            </div>
          </div>
        </div>

        {/* Watch button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/match/${match.id}`}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all',
              isLive || hasStreams
                ? 'bg-wc-gold text-black hover:bg-wc-gold/90 shadow-lg shadow-wc-gold/30'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            )}
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Watch Live
              </>
            ) : isScheduled ? (
              <>
                <span>🔔</span>
                Match Details
              </>
            ) : (
              <>
                <span>📊</span>
                Full Recap
              </>
            )}
          </Link>

          {isLive && !hasStreams && (
            <span className="text-xs text-zinc-500">Stream links updating…</span>
          )}
          {hasStreams && (
            <span className="text-xs text-wc-gold/70 font-medium">
              {match.streams!.length} stream{match.streams!.length > 1 ? 's' : ''} available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

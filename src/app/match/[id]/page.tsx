import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatchById, getMatchWithStreams } from '@/lib/matchService';
import { StreamPanel } from '@/components/stream/StreamPanel';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn, formatMatchDate, formatMatchLocation, formatMatchStage, formatMatchTime, formatVenueName } from '@/lib/utils';

export const revalidate = 15;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rawMatch = await getMatchById(id);
  if (!rawMatch) notFound();

  const match = await getMatchWithStreams(rawMatch);
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white mb-6 transition-colors"
        >
          ← Back to matches
        </Link>

        {/* Match header card */}
        <div
          className={cn(
            'relative rounded-2xl border overflow-hidden mb-6',
            isLive
              ? 'border-red-600/50 bg-gradient-to-b from-red-950/30 to-zinc-950'
              : 'border-zinc-800/60 bg-gradient-to-b from-zinc-900 to-zinc-950'
          )}
        >
          {/* Top accent */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-0.5',
              isLive
                ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                : 'bg-gradient-to-r from-transparent via-wc-gold/50 to-transparent'
            )}
          />

          <div className="px-6 py-8 md:px-10 md:py-10">
            {/* Meta */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {isLive && <LiveBadge />}
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                  {formatMatchStage(match)}
                </span>
              </div>
              <div className="text-right">
                {isScheduled && (
                  <p className="text-xs text-zinc-500">{formatMatchDate(match.utcDate)}</p>
                )}
                {isFinished && (
                  <span className="text-xs font-bold text-zinc-500 tracking-widest">FULL TIME</span>
                )}
                {isLive && match.minute && (
                  <span className="text-sm font-mono text-red-400 font-bold">{match.minute}&apos;</span>
                )}
                {match.status === 'HALF_TIME' && (
                  <span className="text-xs font-bold text-orange-400 tracking-widest">HALF TIME</span>
                )}
              </div>
            </div>

            {/* Teams + Score */}
            <div className="flex items-center justify-between gap-6 md:gap-10">
              {/* Home */}
              <div className="flex-1 flex flex-col items-center gap-3">
                <FlagIcon
                  flag={match.homeTeam.flag}
                  teamName={match.homeTeam.name}
                  size={144}
                  className="h-28 w-28 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-xl md:text-3xl font-black text-white">{match.homeTeam.name}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                    {match.homeTeam.tla}
                  </p>
                </div>
              </div>

              {/* Center */}
              <div className="flex-none flex flex-col items-center gap-3 min-w-[140px] md:min-w-[180px]">
                {isScheduled ? (
                  <>
                    <span className="text-5xl md:text-6xl font-black text-wc-gold">vs</span>
                    <p className="text-lg font-bold text-white">{formatMatchTime(match.utcDate)}</p>
                    <p className="text-2xl md:text-3xl font-black text-wc-gold font-mono">
                      <CountdownTimer utcDate={match.utcDate} />
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-6xl md:text-8xl font-black text-white tabular-nums">
                      {match.score.home ?? 0}
                    </span>
                    <span className="text-3xl text-zinc-600">—</span>
                    <span className="text-6xl md:text-8xl font-black text-white tabular-nums">
                      {match.score.away ?? 0}
                    </span>
                  </div>
                )}
              </div>

              {/* Away */}
              <div className="flex-1 flex flex-col items-center gap-3">
                <FlagIcon
                  flag={match.awayTeam.flag}
                  teamName={match.awayTeam.name}
                  size={144}
                  className="h-28 w-28 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-xl md:text-3xl font-black text-white">{match.awayTeam.name}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                    {match.awayTeam.tla}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Streams + Match info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stream panel */}
            <StreamPanel streams={match.streams || []} matchId={match.id} />

            {/* Match info */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>ℹ️</span> Match Info
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-zinc-500">Venue</dt>
                <dd className="text-white font-medium">{formatVenueName(match.venue)}</dd>

                <dt className="text-zinc-500">City</dt>
                <dd className="text-white font-medium">{formatMatchLocation(match)}</dd>

                <dt className="text-zinc-500">Kick-off</dt>
                <dd className="text-white font-medium">
                  {formatMatchDate(match.utcDate)} · {formatMatchTime(match.utcDate)}
                </dd>

                <dt className="text-zinc-500">Stage</dt>
                <dd className="text-white font-medium">{formatMatchStage(match)}</dd>

                {match.referee && (
                  <>
                    <dt className="text-zinc-500">Referee</dt>
                    <dd className="text-white font-medium">{match.referee}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Right: Stats / Events */}
          <div className="space-y-4">
            {/* Match events placeholder */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>⚡</span> Match Events
              </h3>
              {(match.events?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {match.events!.map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-zinc-500 w-8 text-right">{event.minute}&apos;</span>
                      <span>{event.type === 'GOAL' ? '⚽' : event.type === 'YELLOW_CARD' ? '🟨' : event.type === 'RED_CARD' ? '🟥' : '↕️'}</span>
                      <span className="text-zinc-300">{event.playerName}</span>
                      <span className={cn(
                        'ml-auto text-[10px] uppercase',
                        event.team === 'HOME' ? 'text-blue-400' : 'text-amber-400'
                      )}>
                        {event.team === 'HOME' ? match.homeTeam.tla : match.awayTeam.tla}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  {isScheduled ? 'Events will appear here once the match starts.' : 'No events recorded.'}
                </p>
              )}
            </div>

            {/* Stats */}
            {match.statistics && (
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>📈</span> Statistics
                </h3>
                <StatBar
                  label="Possession"
                  home={match.statistics.possession.home}
                  away={match.statistics.possession.away}
                  unit="%"
                />
                <StatBar
                  label="Shots"
                  home={match.statistics.shots.home}
                  away={match.statistics.shots.away}
                />
                <StatBar
                  label="Shots on Target"
                  home={match.statistics.shotsOnTarget.home}
                  away={match.statistics.shotsOnTarget.away}
                />
                <StatBar
                  label="Corners"
                  home={match.statistics.corners.home}
                  away={match.statistics.corners.away}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  home,
  away,
  unit = '',
}: {
  label: string;
  home: number;
  away: number;
  unit?: string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-white">{home}{unit}</span>
        <span className="text-zinc-500 text-[10px]">{label}</span>
        <span className="font-bold text-white">{away}{unit}</span>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden bg-zinc-800">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${homePct}%` }}
        />
        <div className="bg-amber-500 flex-1" />
      </div>
    </div>
  );
}

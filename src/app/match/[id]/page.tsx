import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MatchEvent } from '@/types';
import { getMatchById, getMatchWithStreams } from '@/lib/matchService';
import { StreamPanel } from '@/components/stream/StreamPanel';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { FlagIcon } from '@/components/ui/FlagIcon';
import {
  cn,
  formatMatchDate,
  formatMatchLocation,
  formatMatchStage,
  formatMatchTime,
  formatVenueName,
} from '@/lib/utils';

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
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          {'<- Back to matches'}
        </Link>

        <div
          className={cn(
            'relative mb-6 overflow-hidden rounded-2xl border',
            isLive
              ? 'border-red-600/50 bg-gradient-to-b from-red-950/30 to-zinc-950'
              : 'border-zinc-800/60 bg-gradient-to-b from-zinc-900 to-zinc-950'
          )}
        >
          <div
            className={cn(
              'absolute left-0 right-0 top-0 h-0.5',
              isLive
                ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                : 'bg-gradient-to-r from-transparent via-wc-gold/50 to-transparent'
            )}
          />

          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLive && <LiveBadge />}
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {formatMatchStage(match)}
                </span>
              </div>
              <div className="text-right">
                {isScheduled && <p className="text-xs text-zinc-500">{formatMatchDate(match.utcDate)}</p>}
                {isFinished && (
                  <span className="text-xs font-bold tracking-widest text-zinc-500">FULL TIME</span>
                )}
                {isLive && match.minute && (
                  <span className="text-sm font-bold text-red-400">{match.minute}&apos;</span>
                )}
                {match.status === 'HALF_TIME' && (
                  <span className="text-xs font-bold tracking-widest text-orange-400">HALF TIME</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 md:gap-10">
              <div className="flex flex-1 flex-col items-center gap-3">
                <FlagIcon
                  flag={match.homeTeam.flag}
                  teamName={match.homeTeam.name}
                  size={144}
                  className="h-28 w-28 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-xl font-black text-white md:text-3xl">{match.homeTeam.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                    {match.homeTeam.tla}
                  </p>
                </div>
              </div>

              <div className="flex min-w-[140px] flex-none flex-col items-center gap-3 md:min-w-[180px]">
                {isScheduled ? (
                  <>
                    <span className="text-5xl font-black text-wc-gold md:text-6xl">vs</span>
                    <p className="text-lg font-bold text-white">{formatMatchTime(match.utcDate)}</p>
                    <p className="font-mono text-2xl font-black text-wc-gold md:text-3xl">
                      <CountdownTimer utcDate={match.utcDate} />
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="tabular-nums text-6xl font-black text-white md:text-8xl">
                      {match.score.home ?? 0}
                    </span>
                    <span className="text-3xl text-zinc-600">-</span>
                    <span className="tabular-nums text-6xl font-black text-white md:text-8xl">
                      {match.score.away ?? 0}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col items-center gap-3">
                <FlagIcon
                  flag={match.awayTeam.flag}
                  teamName={match.awayTeam.name}
                  size={144}
                  className="h-28 w-28 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-xl font-black text-white md:text-3xl">{match.awayTeam.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                    {match.awayTeam.tla}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <StreamPanel streams={match.streams || []} matchId={match.id} />

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <span>i</span> Match Info
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-zinc-500">Venue</dt>
                <dd className="font-medium text-white">{formatVenueName(match.venue)}</dd>

                <dt className="text-zinc-500">City</dt>
                <dd className="font-medium text-white">{formatMatchLocation(match)}</dd>

                <dt className="text-zinc-500">Kick-off</dt>
                <dd className="font-medium text-white">
                  {formatMatchDate(match.utcDate)} - {formatMatchTime(match.utcDate)}
                </dd>

                <dt className="text-zinc-500">Stage</dt>
                <dd className="font-medium text-white">{formatMatchStage(match)}</dd>

                {match.referee && (
                  <>
                    <dt className="text-zinc-500">Referee</dt>
                    <dd className="font-medium text-white">{match.referee}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <span>+</span> Match Events
              </h3>
              {(match.events?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {match.events!
                    .slice()
                    .sort((a, b) => b.minute - a.minute)
                    .map((event, i) => (
                      <div
                        key={`${event.type}-${event.minute}-${event.playerName || 'event'}-${i}`}
                        className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 px-3 py-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-zinc-900 text-sm text-zinc-200">
                            {getEventIcon(event.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-white">
                                {formatEventHeadline(event)}
                              </p>
                              <span className="flex-none font-mono text-xs text-zinc-400">
                                {formatEventMinute(event.minute, event.minuteLabel)}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3">
                              <p className="truncate text-xs text-zinc-500">
                                {formatEventSecondary(event)}
                              </p>
                              <span
                                className={cn(
                                  'flex-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                  event.team === 'HOME'
                                    ? 'bg-blue-500/10 text-blue-300'
                                    : 'bg-amber-500/10 text-amber-300'
                                )}
                              >
                                {event.team === 'HOME' ? match.homeTeam.tla : match.awayTeam.tla}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  {isScheduled ? 'Events will appear here once the match starts.' : 'No events recorded.'}
                </p>
              )}
            </div>

            {match.statistics && (
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span>#</span> Statistics
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

function getEventIcon(type: MatchEvent['type']): string {
  switch (type) {
    case 'GOAL':
      return 'G';
    case 'OWN_GOAL':
      return 'OG';
    case 'PENALTY':
      return 'P';
    case 'YELLOW_CARD':
      return 'YC';
    case 'RED_CARD':
      return 'RC';
    case 'SUBSTITUTION':
      return 'SUB';
    default:
      return 'EV';
  }
}

function formatEventHeadline(event: MatchEvent): string {
  const player = event.playerName?.trim() || getEventTypeLabel(event.type);

  switch (event.type) {
    case 'GOAL':
      return `${player} scored`;
    case 'OWN_GOAL':
      return `Own goal by ${player}`;
    case 'PENALTY':
      return `${player} penalty`;
    case 'YELLOW_CARD':
      return `${player} booked`;
    case 'RED_CARD':
      return `${player} sent off`;
    case 'SUBSTITUTION':
      return player;
    default:
      return player;
  }
}

function formatEventSecondary(event: MatchEvent): string {
  const details: string[] = [getEventTypeLabel(event.type)];

  if (event.assistName) {
    details.push(`Assist: ${event.assistName}`);
  }

  return details.join(' - ');
}

function getEventTypeLabel(type: MatchEvent['type']): string {
  switch (type) {
    case 'GOAL':
      return 'Goal';
    case 'OWN_GOAL':
      return 'Own goal';
    case 'PENALTY':
      return 'Penalty';
    case 'YELLOW_CARD':
      return 'Yellow card';
    case 'RED_CARD':
      return 'Red card';
    case 'SUBSTITUTION':
      return 'Substitution';
    default:
      return 'Event';
  }
}

function formatEventMinute(minute: number, minuteLabel?: string): string {
  if (minuteLabel) {
    return minuteLabel;
  }

  if (!Number.isFinite(minute) || minute <= 0) {
    return "0'";
  }

  return `${minute}'`;
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
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-white">
          {home}
          {unit}
        </span>
        <span className="text-[10px] text-zinc-500">{label}</span>
        <span className="font-bold text-white">
          {away}
          {unit}
        </span>
      </div>
      <div className="flex h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="bg-blue-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="flex-1 bg-amber-500" />
      </div>
    </div>
  );
}

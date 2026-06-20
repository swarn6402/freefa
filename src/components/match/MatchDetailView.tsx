'use client';

import Link from 'next/link';
import { Match, MatchEvent } from '@/types';
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
  getMatchMinuteDisplay,
} from '@/lib/utils';

interface MatchDetailViewProps {
  match: Match;
}

export function MatchDetailView({ match }: MatchDetailViewProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';
  const minuteDisplay = getMatchMinuteDisplay(match);

  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white sm:mb-6"
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

          <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-10">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                {isLive && <LiveBadge />}
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-widest">
                  {formatMatchStage(match)}
                </span>
              </div>
              <div className="text-left sm:text-right">
                {isScheduled && <p className="text-xs text-zinc-500">{formatMatchDate(match.utcDate)}</p>}
                {isFinished && (
                  <span className="text-xs font-bold tracking-widest text-zinc-500">FULL TIME</span>
                )}
                {isLive && minuteDisplay && minuteDisplay !== 'HT' && (
                  <span className="text-sm font-bold text-red-400">{minuteDisplay}</span>
                )}
                {match.status === 'HALF_TIME' && (
                  <span className="text-xs font-bold tracking-widest text-orange-400">HALF TIME</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6 md:gap-10">
              <div className="flex flex-col items-center gap-3">
                <FlagIcon
                  flag={match.homeTeam.flag}
                  teamName={match.homeTeam.name}
                  size={144}
                  className="h-20 w-20 sm:h-24 sm:w-24 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-lg font-black text-white sm:text-xl md:text-3xl">{match.homeTeam.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                    {match.homeTeam.tla}
                  </p>
                </div>
              </div>

              <div className="order-first flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 sm:order-none sm:min-w-[160px] md:min-w-[180px]">
                {isScheduled ? (
                  <>
                    <span className="text-4xl font-black text-wc-gold sm:text-5xl md:text-6xl">vs</span>
                    <p className="text-base font-bold text-white sm:text-lg">{formatMatchTime(match.utcDate)}</p>
                    <p className="font-mono text-xl font-black text-wc-gold sm:text-2xl md:text-3xl">
                      <CountdownTimer utcDate={match.utcDate} />
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="tabular-nums text-5xl font-black text-white sm:text-6xl md:text-8xl">
                        {match.score.home ?? 0}
                      </span>
                      <span className="text-2xl text-zinc-600 sm:text-3xl">-</span>
                      <span className="tabular-nums text-5xl font-black text-white sm:text-6xl md:text-8xl">
                        {match.score.away ?? 0}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500">{formatVenueName(match.venue)}</p>
                      <p className="mt-1 text-xs text-zinc-600">{formatMatchLocation(match)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <FlagIcon
                  flag={match.awayTeam.flag}
                  teamName={match.awayTeam.name}
                  size={144}
                  className="h-20 w-20 sm:h-24 sm:w-24 md:h-36 md:w-36"
                />
                <div className="text-center">
                  <p className="text-lg font-black text-white sm:text-xl md:text-3xl">{match.awayTeam.name}</p>
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
            <StreamPanel
              streams={match.streams || []}
              matchId={match.id}
              status={match.status}
            />

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <span>i</span> Match Info
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
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
                              <p className="min-w-0 text-sm font-semibold text-white sm:truncate">
                                {formatEventHeadline(event)}
                              </p>
                              <span className="flex-none font-mono text-xs text-zinc-400">
                                {formatEventMinute(event.minute, event.minuteLabel)}
                              </span>
                            </div>

                            <div className="mt-1 flex items-start justify-between gap-3">
                              <p className="min-w-0 text-xs leading-5 text-zinc-500 sm:truncate">
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

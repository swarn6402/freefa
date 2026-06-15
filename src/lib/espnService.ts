import { Match, MatchEvent } from '@/types';

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const SCOREBOARD_CACHE_TTL = 60 * 1000;
const DEFAULT_ESPN_REVALIDATE_SECONDS = 60;

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

interface EspnEvent {
  id: string;
  date: string;
  competitions?: EspnCompetition[];
}

interface EspnCompetition {
  date?: string;
  venue?: {
    fullName?: string;
    address?: {
      city?: string;
      country?: string;
    };
  };
  competitors?: EspnCompetitor[];
  details?: EspnDetail[];
}

interface EspnCompetitor {
  homeAway?: 'home' | 'away';
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
    location?: string;
  };
}

interface EspnDetail {
  type?: {
    text?: string;
  };
  clock?: {
    value?: number;
    displayValue?: string;
  };
  team?: {
    id?: string;
  };
  scoringPlay?: boolean;
  ownGoal?: boolean;
  penaltyKick?: boolean;
  athletesInvolved?: Array<{
    displayName?: string;
    team?: {
      id?: string;
    };
  }>;
}

const scoreboardCache = new Map<string, { fetchedAt: number; events: EspnEvent[] }>();

export async function enrichMatchWithEspnEvents(
  match: Match,
  options?: { revalidateSeconds?: number }
): Promise<Match> {
  if (match.status === 'SCHEDULED') {
    return match;
  }

  try {
    const candidates = await getCandidateEspnEvents(
      match.utcDate,
      options?.revalidateSeconds ?? DEFAULT_ESPN_REVALIDATE_SECONDS
    );
    const espnEvent = findMatchingEspnEvent(match, candidates);
    if (!espnEvent) {
      return match;
    }

    const competition = espnEvent.competitions?.[0];
    const events = mapEspnGoalEvents(competition?.details || [], competition?.competitors || []);
    const venue = competition?.venue?.fullName?.trim();
    const city = competition?.venue?.address?.city?.trim();
    const country = competition?.venue?.address?.country?.trim();

    return {
      ...match,
      venue: venue || match.venue,
      city: city || match.city,
      country: country || match.country,
      events: events.length > 0 ? events : match.events,
    };
  } catch (error) {
    console.warn('[espnService] Failed to enrich match with ESPN events:', error);
    return match;
  }
}

async function getCandidateEspnEvents(utcDate: string, revalidateSeconds: number): Promise<EspnEvent[]> {
  const dates = getEspnDateWindow(utcDate);
  const eventLists = await Promise.all(
    dates.map((date) => getScoreboardEventsForDate(date, revalidateSeconds))
  );
  return eventLists.flat();
}

async function getScoreboardEventsForDate(date: string, revalidateSeconds: number): Promise<EspnEvent[]> {
  const cached = scoreboardCache.get(date);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < SCOREBOARD_CACHE_TTL) {
    return cached.events;
  }

  const response = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${date}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EspnScoreboardResponse;
  const events = data.events || [];
  scoreboardCache.set(date, { fetchedAt: now, events });
  return events;
}

function getEspnDateWindow(utcDate: string): string[] {
  const baseDate = new Date(utcDate);
  const dates: string[] = [];

  for (const offset of [-1, 0, 1]) {
    const date = new Date(baseDate);
    date.setUTCDate(baseDate.getUTCDate() + offset);
    dates.push(formatEspnDate(date));
  }

  return [...new Set(dates)];
}

function formatEspnDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function findMatchingEspnEvent(match: Match, events: EspnEvent[]): EspnEvent | null {
  const matchTime = new Date(match.utcDate).getTime();

  const candidates = events
    .map((event) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const home = competitors.find((entry) => entry.homeAway === 'home');
      const away = competitors.find((entry) => entry.homeAway === 'away');

      if (!home || !away) {
        return null;
      }

      const isHomeMatch = isSameTeam(match.homeTeam, home.team);
      const isAwayMatch = isSameTeam(match.awayTeam, away.team);
      const kickoff = new Date(competition?.date || event.date).getTime();
      const diffHours = Math.abs(kickoff - matchTime) / (1000 * 60 * 60);

      if (!isHomeMatch || !isAwayMatch || diffHours > 12) {
        return null;
      }

      return { event, diffHours };
    })
    .filter((entry): entry is { event: EspnEvent; diffHours: number } => Boolean(entry))
    .sort((a, b) => a.diffHours - b.diffHours);

  return candidates[0]?.event || null;
}

function isSameTeam(matchTeam: Match['homeTeam'], espnTeam?: EspnCompetitor['team']): boolean {
  if (!espnTeam) {
    return false;
  }

  const espnTokens = [
    espnTeam.abbreviation,
    espnTeam.displayName,
    espnTeam.shortDisplayName,
    espnTeam.name,
    espnTeam.location,
  ]
    .filter(Boolean)
    .map(normalizeToken);

  const matchTokens = [
    matchTeam.tla,
    matchTeam.name,
    matchTeam.shortName,
  ].map(normalizeToken);

  return matchTokens.some((token) => token && espnTokens.includes(token));
}

function normalizeToken(value?: string | null): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function mapEspnGoalEvents(details: EspnDetail[], competitors: EspnCompetitor[]): MatchEvent[] {
  const homeCompetitor = competitors.find((entry) => entry.homeAway === 'home');
  const awayCompetitor = competitors.find((entry) => entry.homeAway === 'away');
  const homeTeamId = normalizeToken(homeCompetitor?.team?.id);
  const awayTeamId = normalizeToken(awayCompetitor?.team?.id);

  return details
    .filter(
      (detail) =>
        detail.scoringPlay &&
        (detail.penaltyKick || detail.ownGoal || (detail.type?.text || '').toLowerCase().includes('goal'))
    )
    .map((detail) => mapEspnGoalEvent(detail, homeTeamId, awayTeamId))
    .filter((event): event is MatchEvent => Boolean(event));
}

function mapEspnGoalEvent(
  detail: EspnDetail,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent | null {
  const typeText = (detail.type?.text || '').toLowerCase();
  const isOwnGoal = Boolean(detail.ownGoal) || typeText.includes('own goal');
  const isPenalty = Boolean(detail.penaltyKick);
  const player = detail.athletesInvolved?.[0];

  const eventType: MatchEvent['type'] = isOwnGoal
    ? 'OWN_GOAL'
    : isPenalty
      ? 'PENALTY'
      : 'GOAL';

  const eventTeamId = normalizeToken(detail.team?.id);
  const playerTeamId = normalizeToken(player?.team?.id);

  const team = resolveEventTeam(eventType, eventTeamId, playerTeamId, homeTeamId, awayTeamId);
  const minuteLabel = detail.clock?.displayValue || undefined;
  const minuteFromClock = parseEspnMinute(minuteLabel, detail.clock?.value);

  return {
    minute: minuteFromClock,
    minuteLabel,
    type: eventType,
    team,
    playerName: player?.displayName || undefined,
  };
}

function resolveEventTeam(
  eventType: MatchEvent['type'],
  eventTeamId: string,
  playerTeamId: string,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent['team'] {
  const preferred = eventType === 'OWN_GOAL' && playerTeamId ? playerTeamId : eventTeamId;

  if (preferred && preferred === awayTeamId) {
    return 'AWAY';
  }

  if (preferred && preferred === homeTeamId) {
    return 'HOME';
  }

  return 'HOME';
}

function parseEspnMinute(displayValue?: string, fallbackClockValue?: number): number {
  if (displayValue) {
    const normalized = displayValue.replace(/\s+/g, '');
    const extraTimeMatch = normalized.match(/^(\d+)'?\+(\d+)'?$/);
    if (extraTimeMatch) {
      return Number.parseInt(extraTimeMatch[1], 10) + Number.parseInt(extraTimeMatch[2], 10);
    }

    const regularMatch = normalized.match(/^(\d+)'?$/);
    if (regularMatch) {
      return Number.parseInt(regularMatch[1], 10);
    }
  }

  if (typeof fallbackClockValue === 'number' && Number.isFinite(fallbackClockValue)) {
    return Math.max(0, Math.round(fallbackClockValue / 60));
  }

  return 0;
}

import { Match, MatchEvent, Team } from '@/types';
import { getFlagForTeam } from './teamFlags';

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const SCOREBOARD_CACHE_TTL = 60 * 1000;

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
  // ESPN sends scores as strings ("5", "1"); coerced to numbers on read.
  score?: number | string;
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

export async function enrichMatchWithEspnEvents(match: Match): Promise<Match> {
  if (match.status === 'SCHEDULED') {
    return match;
  }

  try {
    const candidates = await getCandidateEspnEvents(match.utcDate);
    const espnEvent = findMatchingEspnEvent(match, candidates);
    if (!espnEvent) {
      return match;
    }

    const competition = espnEvent.competitions?.[0];
    const events = mapEspnGoalEvents(competition?.details || [], competition?.competitors || []);
    const venue = competition?.venue?.fullName?.trim();
    const city = competition?.venue?.address?.city?.trim();
    const country = competition?.venue?.address?.country?.trim();

    // Extract scores from ESPN competitors
    const espnScore = extractEspnScore(competition?.competitors || []);

    return {
      ...match,
      venue: venue || match.venue,
      city: city || match.city,
      country: country || match.country,
      events: events.length > 0 ? events : match.events,
      // Use ESPN score if available and current score is missing
      score: {
        home: match.score.home ?? espnScore.home,
        away: match.score.away ?? espnScore.away,
      },
    };
  } catch (error) {
    console.warn('[espnService] Failed to enrich match with ESPN events:', error);
    return match;
  }
}

async function getCandidateEspnEvents(utcDate: string): Promise<EspnEvent[]> {
  const dates = getEspnDateWindow(utcDate);
  const eventLists = await Promise.all(
    dates.map((date) => getScoreboardEventsForDate(date))
  );
  return eventLists.flat();
}

async function getScoreboardEventsForDate(date: string): Promise<EspnEvent[]> {
  const cached = scoreboardCache.get(date);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < SCOREBOARD_CACHE_TTL) {
    return cached.events;
  }

  const response = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${date}`, {
    cache: 'no-store',
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

  if (candidates[0]) {
    return candidates[0].event;
  }

  // Identity matching fails for still-undetermined knockout fixtures (both teams
  // are "TBD"), so fall back to kickoff proximity: pick the single ESPN event
  // whose kickoff is closest to this fixture, within a tight window. Kickoffs in
  // the knockout rounds are spaced hours apart, so the nearest one is reliable.
  if (hasUndeterminedTeam(match)) {
    const byKickoff = events
      .map((event) => {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors || [];
        const home = competitors.find((entry) => entry.homeAway === 'home');
        const away = competitors.find((entry) => entry.homeAway === 'away');
        if (!home || !away) {
          return null;
        }
        const kickoff = new Date(competition?.date || event.date).getTime();
        const diffHours = Math.abs(kickoff - matchTime) / (1000 * 60 * 60);
        return { event, diffHours };
      })
      .filter((entry): entry is { event: EspnEvent; diffHours: number } => Boolean(entry))
      .filter((entry) => entry.diffHours <= 3)
      .sort((a, b) => a.diffHours - b.diffHours);

    return byKickoff[0]?.event || null;
  }

  return null;
}

// A team is "undetermined" when upstream hasn't assigned it yet — the mapper
// fills such slots with the literal "TBD" placeholder and a blank flag.
function isUndeterminedTeam(team: Match['homeTeam']): boolean {
  return !team || !team.tla || team.tla === 'TBD' || !team.name || team.name === 'TBD';
}

function hasUndeterminedTeam(match: Match): boolean {
  return isUndeterminedTeam(match.homeTeam) || isUndeterminedTeam(match.awayTeam);
}

function espnCompetitorToTeam(competitor: EspnCompetitor, fallbackId: number): Team {
  const tla = (competitor.team?.abbreviation || '').toUpperCase();
  const name =
    competitor.team?.displayName ||
    competitor.team?.name ||
    competitor.team?.location ||
    competitor.team?.shortDisplayName ||
    'TBD';

  return {
    id: fallbackId,
    name,
    shortName: competitor.team?.shortDisplayName || competitor.team?.name || name,
    tla: tla || 'TBD',
    flag: getFlagForTeam(tla || undefined),
  };
}

/**
 * Backfill team identity (name / shortName / tla / flag) for fixtures whose
 * teams are still "TBD" — i.e. knockout matches the football-data feed hasn't
 * populated yet. ESPN's scoreboard already knows the real teams, so we match by
 * date + kickoff proximity and copy them in. Only TBD slots are touched;
 * already-known teams are left exactly as-is.
 *
 * Run this BEFORE enrichMatchesWithEspnScores so the score pass (which matches
 * ESPN events by team identity) can then find these fixtures too.
 */
export async function enrichMatchesWithEspnTeams(matches: Match[]): Promise<Match[]> {
  const candidates = matches.filter(hasUndeterminedTeam);
  if (candidates.length === 0) return matches;

  const uniqueDates = [...new Set(candidates.map((m) => formatEspnDate(new Date(m.utcDate))))];
  const allEspnEvents: EspnEvent[] = [];
  for (const date of uniqueDates) {
    try {
      allEspnEvents.push(...(await getScoreboardEventsForDate(date)));
    } catch {
      // Individual date fetch failure is non-fatal; skip.
    }
  }

  if (allEspnEvents.length === 0) return matches;

  return matches.map((match) => {
    if (!hasUndeterminedTeam(match)) return match;

    const espnEvent = findMatchingEspnEvent(match, allEspnEvents);
    if (!espnEvent) return match;

    const competitors = espnEvent.competitions?.[0]?.competitors || [];
    const home = competitors.find((entry) => entry.homeAway === 'home');
    const away = competitors.find((entry) => entry.homeAway === 'away');
    if (!home || !away) return match;

    return {
      ...match,
      homeTeam: isUndeterminedTeam(match.homeTeam)
        ? espnCompetitorToTeam(home, match.homeTeam?.id ?? -1)
        : match.homeTeam,
      awayTeam: isUndeterminedTeam(match.awayTeam)
        ? espnCompetitorToTeam(away, match.awayTeam?.id ?? -2)
        : match.awayTeam,
    };
  });
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

/**
 * Batch-enrich scores for multiple matches with a single ESPN scoreboard sweep.
 * Collects unique dates, fetches each once (cached), then patches scores
 * via existing team-matching logic. Only touches matches missing scores.
 */
export async function enrichMatchesWithEspnScores(matches: Match[]): Promise<Match[]> {
  const candidates = matches.filter(
    (m) => (m.status === 'FINISHED' || m.status === 'LIVE' || m.status === 'HALF_TIME') && (m.score.home === null || m.score.away === null)
  );
  if (candidates.length === 0) return matches;

  // Gather unique date strings to fetch
  const uniqueDates = [...new Set(candidates.map((m) => formatEspnDate(new Date(m.utcDate))))];
  const allEspnEvents: EspnEvent[] = [];
  for (const date of uniqueDates) {
    try {
      allEspnEvents.push(...(await getScoreboardEventsForDate(date)));
    } catch {
      // Individual date fetch failure is non-fatal; skip
    }
  }

  if (allEspnEvents.length === 0) return matches;

  // Build a quick lookup: espn event id -> competitors
  const espnMap = new Map<string, EspnCompetitor[]>();
  for (const event of allEspnEvents) {
    const comp = event.competitions?.[0];
    if (comp?.competitors?.length) {
      espnMap.set(event.id, comp.competitors);
    }
  }

  // For each candidate, find matching ESPN event and patch score
  return matches.map((match) => {
    if (match.score.home !== null && match.score.away !== null) return match;
    if (match.status === 'SCHEDULED') return match;

    const espnEvent = findMatchingEspnEvent(match, allEspnEvents);
    if (!espnEvent) return match;

    const competitors = espnMap.get(espnEvent.id);
    if (!competitors) return match;

    const espnScore = extractEspnScore(competitors);
    return {
      ...match,
      score: {
        home: match.score.home ?? espnScore.home,
        away: match.score.away ?? espnScore.away,
      },
    };
  });
}

function extractEspnScore(competitors: EspnCompetitor[]): { home: number | null; away: number | null } {
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');

  return {
    home: coerceEspnScore(home?.score),
    away: coerceEspnScore(away?.score),
  };
}

// ESPN delivers scores as strings ("5"); normalize to a finite, non-negative number.
// Blank/whitespace strings mean "no score yet" and map to null (not 0).
function coerceEspnScore(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string' && raw.trim() === '') return null;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

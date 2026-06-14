import { Match, MatchEvent, MatchStatistics } from '@/types';

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;
const SCHEDULE_CACHE_TTL = 30 * 60 * 1000;
const DETAIL_CACHE_TTL = 30 * 1000;

type ApiFootballStatus = Match['status'];

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
    venue?: {
      name?: string | null;
      city?: string | null;
    } | null;
    status?: {
      short?: string | null;
      elapsed?: number | null;
    } | null;
  };
  teams: {
    home: {
      id?: number | null;
      name?: string | null;
      code?: string | null;
    };
    away: {
      id?: number | null;
      name?: string | null;
      code?: string | null;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  } | null;
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    } | null;
  } | null;
  events?: ApiFootballEvent[];
  statistics?: ApiFootballTeamStatistics[];
}

interface ApiFootballEvent {
  time?: {
    elapsed?: number | null;
    extra?: number | null;
  } | null;
  team?: {
    id?: number | null;
  } | null;
  player?: {
    name?: string | null;
  } | null;
  assist?: {
    name?: string | null;
  } | null;
  type?: string | null;
  detail?: string | null;
}

interface ApiFootballTeamStatistics {
  team?: {
    id?: number | null;
  } | null;
  statistics?: Array<{
    type?: string | null;
    value?: string | number | null;
  }>;
}

interface ApiFootballResponse<T> {
  errors?: Record<string, string>;
  response: T[];
}

let scheduleCache: ApiFootballFixture[] | null = null;
let scheduleCacheAt = 0;
let apiFootballDisabledReason: string | null = null;

const detailCache = new Map<number, { fixture: ApiFootballFixture; fetchedAt: number }>();

export function hasApiFootballKey(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

export async function enrichMatchesWithApiFootballSchedule(matches: Match[]): Promise<Match[]> {
  if (!hasApiFootballKey()) {
    return matches;
  }

  if (apiFootballDisabledReason) {
    return matches;
  }

  try {
    const fixtures = await getWorldCupFixtures();
    if (fixtures.length === 0) {
      return matches;
    }

    return matches.map((match) => {
      const fixture = findFixtureForMatch(match, fixtures);
      if (!fixture) {
        return match;
      }

      return mergeScheduleData(match, fixture);
    });
  } catch (error) {
    if (apiFootballDisabledReason) {
      return matches;
    }
    console.warn('[apiFootball] Failed to enrich matches with schedule data:', error);
    return matches;
  }
}

export async function enrichMatchWithApiFootballDetail(match: Match): Promise<Match> {
  if (!hasApiFootballKey()) {
    return match;
  }

  if (apiFootballDisabledReason) {
    return match;
  }

  try {
    const fixtures = await getWorldCupFixtures();
    const scheduleFixture = findFixtureForMatch(match, fixtures);
    if (!scheduleFixture) {
      return match;
    }

    const detailFixture = await getFixtureDetail(scheduleFixture.fixture.id);
    if (!detailFixture) {
      return mergeScheduleData(match, scheduleFixture);
    }

    return mergeDetailData(mergeScheduleData(match, detailFixture), detailFixture);
  } catch (error) {
    if (apiFootballDisabledReason) {
      return match;
    }
    console.warn('[apiFootball] Failed to enrich match with live detail:', error);
    return match;
  }
}

async function getWorldCupFixtures(): Promise<ApiFootballFixture[]> {
  const now = Date.now();
  if (scheduleCache && now - scheduleCacheAt < SCHEDULE_CACHE_TTL) {
    return scheduleCache;
  }

  const response = await fetchApiFootball<ApiFootballFixture>(
    '/fixtures',
    {
      league: String(WORLD_CUP_LEAGUE_ID),
      season: String(WORLD_CUP_SEASON),
    },
    1800
  );

  scheduleCache = response;
  scheduleCacheAt = now;
  return response;
}

async function getFixtureDetail(fixtureId: number): Promise<ApiFootballFixture | null> {
  const cached = detailCache.get(fixtureId);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < DETAIL_CACHE_TTL) {
    return cached.fixture;
  }

  const response = await fetchApiFootball<ApiFootballFixture>(
    '/fixtures',
    { id: String(fixtureId) },
    30
  );

  const fixture = response[0] || null;
  if (fixture) {
    detailCache.set(fixtureId, { fixture, fetchedAt: now });
  }

  return fixture;
}

async function fetchApiFootball<T>(
  path: string,
  params: Record<string, string>,
  revalidateSeconds: number
): Promise<T[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return [];
  }

  const searchParams = new URLSearchParams(params);
  const url = `${API_FOOTBALL_BASE_URL}${path}?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ApiFootballResponse<T>;
  const errors = data.errors || {};
  const firstError = Object.values(errors).find(Boolean);

  if (firstError) {
    if (firstError.toLowerCase().includes('free plans do not have access to this season')) {
      apiFootballDisabledReason = firstError;
      console.warn('[apiFootball] Disabled for current runtime:', firstError);
    }

    throw new Error(firstError);
  }

  return data.response || [];
}

function findFixtureForMatch(match: Match, fixtures: ApiFootballFixture[]): ApiFootballFixture | null {
  const matchKey = buildMatchKey(match.homeTeam.tla, match.awayTeam.tla, match.utcDate);
  const nameKey = buildMatchKey(match.homeTeam.name, match.awayTeam.name, match.utcDate);

  for (const fixture of fixtures) {
    const fixtureCodeKey = buildMatchKey(
      fixture.teams.home.code || fixture.teams.home.name,
      fixture.teams.away.code || fixture.teams.away.name,
      fixture.fixture.date
    );
    if (fixtureCodeKey === matchKey) {
      return fixture;
    }

    const fixtureNameKey = buildMatchKey(
      fixture.teams.home.name,
      fixture.teams.away.name,
      fixture.fixture.date
    );
    if (fixtureNameKey === nameKey) {
      return fixture;
    }
  }

  return null;
}

function buildMatchKey(home: string | null | undefined, away: string | null | undefined, utcDate: string): string {
  return [
    normalizeToken(home),
    normalizeToken(away),
    normalizeDateToMinute(utcDate),
  ].join('|');
}

function normalizeToken(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeDateToMinute(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 16);
}

function mergeScheduleData(match: Match, fixture: ApiFootballFixture): Match {
  const venue = fixture.fixture.venue?.name?.trim();
  const city = fixture.fixture.venue?.city?.trim();

  return {
    ...match,
    venue: venue || match.venue,
    city: city || match.city,
    country: match.country || inferHostCountry(city, venue),
    referee: match.referee || fixture.fixture.referee || undefined,
  };
}

function mergeDetailData(match: Match, fixture: ApiFootballFixture): Match {
  const status = mapApiFootballStatus(fixture.fixture.status?.short) || match.status;
  const minute = fixture.fixture.status?.elapsed ?? match.minute;
  const events = mapApiFootballEvents(fixture);
  const statistics = mapApiFootballStatistics(fixture);

  return {
    ...match,
    status,
    score: {
      home: fixture.goals?.home ?? match.score.home,
      away: fixture.goals?.away ?? match.score.away,
    },
    halfTimeScore: {
      home: fixture.score?.halftime?.home ?? match.halfTimeScore?.home ?? null,
      away: fixture.score?.halftime?.away ?? match.halfTimeScore?.away ?? null,
    },
    minute,
    events: events.length > 0 ? events : match.events,
    statistics: statistics || match.statistics,
    referee: fixture.fixture.referee || match.referee,
  };
}

function mapApiFootballStatus(status?: string | null): ApiFootballStatus | null {
  const normalized = (status || '').toUpperCase();
  const liveStatuses = new Set(['1H', '2H', 'ET', 'BT', 'LIVE', 'P', 'INT']);

  if (liveStatuses.has(normalized)) {
    return 'LIVE';
  }

  if (normalized === 'HT') {
    return 'HALF_TIME';
  }

  if (normalized === 'FT' || normalized === 'AET' || normalized === 'PEN') {
    return 'FINISHED';
  }

  if (normalized === 'PST' || normalized === 'SUSP' || normalized === 'CANC' || normalized === 'ABD') {
    return 'POSTPONED';
  }

  if (normalized === 'NS' || normalized === 'TBD') {
    return 'SCHEDULED';
  }

  return null;
}

function mapApiFootballEvents(fixture: ApiFootballFixture): MatchEvent[] {
  const homeTeamId = fixture.teams.home.id ?? null;
  const awayTeamId = fixture.teams.away.id ?? null;

  return (fixture.events || [])
    .map((event) => mapApiFootballEvent(event, homeTeamId, awayTeamId))
    .filter((event): event is MatchEvent => Boolean(event));
}

function mapApiFootballEvent(
  event: ApiFootballEvent,
  homeTeamId: number | null,
  awayTeamId: number | null
): MatchEvent | null {
  const mappedType = toMatchEventType(event.type, event.detail);
  if (!mappedType) {
    return null;
  }

  const teamId = event.team?.id ?? null;
  const team: MatchEvent['team'] = teamId === awayTeamId && awayTeamId !== null ? 'AWAY' : 'HOME';
  if (teamId !== null && homeTeamId !== null && awayTeamId !== null && teamId !== homeTeamId && teamId !== awayTeamId) {
    return null;
  }

  return {
    minute: event.time?.elapsed ?? 0,
    type: mappedType,
    team,
    playerName: event.player?.name || undefined,
    assistName: event.assist?.name || undefined,
  };
}

function toMatchEventType(type?: string | null, detail?: string | null): MatchEvent['type'] | null {
  const normalizedType = (type || '').toLowerCase();
  const normalizedDetail = (detail || '').toLowerCase();

  if (normalizedType === 'goal') {
    if (normalizedDetail.includes('own')) return 'OWN_GOAL';
    if (normalizedDetail.includes('penalty')) return 'PENALTY';
    return 'GOAL';
  }

  if (normalizedType === 'card') {
    if (normalizedDetail.includes('yellow')) return 'YELLOW_CARD';
    if (normalizedDetail.includes('red')) return 'RED_CARD';
  }

  if (normalizedType === 'subst') {
    return 'SUBSTITUTION';
  }

  return null;
}

function mapApiFootballStatistics(fixture: ApiFootballFixture): MatchStatistics | null {
  const statistics = fixture.statistics || [];
  if (statistics.length < 2) {
    return null;
  }

  const homeStats = statistics.find((entry) => entry.team?.id === fixture.teams.home.id) || statistics[0];
  const awayStats = statistics.find((entry) => entry.team?.id === fixture.teams.away.id) || statistics[1];

  return {
    possession: {
      home: getStatisticValue(homeStats, 'Ball Possession'),
      away: getStatisticValue(awayStats, 'Ball Possession'),
    },
    shots: {
      home: getStatisticValue(homeStats, 'Total Shots'),
      away: getStatisticValue(awayStats, 'Total Shots'),
    },
    shotsOnTarget: {
      home: getStatisticValue(homeStats, 'Shots on Goal'),
      away: getStatisticValue(awayStats, 'Shots on Goal'),
    },
    corners: {
      home: getStatisticValue(homeStats, 'Corner Kicks'),
      away: getStatisticValue(awayStats, 'Corner Kicks'),
    },
    fouls: {
      home: getStatisticValue(homeStats, 'Fouls'),
      away: getStatisticValue(awayStats, 'Fouls'),
    },
    yellowCards: {
      home: getStatisticValue(homeStats, 'Yellow Cards'),
      away: getStatisticValue(awayStats, 'Yellow Cards'),
    },
    redCards: {
      home: getStatisticValue(homeStats, 'Red Cards'),
      away: getStatisticValue(awayStats, 'Red Cards'),
    },
  };
}

function getStatisticValue(entry: ApiFootballTeamStatistics, label: string): number {
  const statistic = (entry.statistics || []).find((item) => item.type === label);
  const value = statistic?.value;

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function inferHostCountry(city?: string | null, venue?: string | null): string {
  const value = `${city || ''} ${venue || ''}`.toLowerCase();

  if (
    value.includes('toronto') ||
    value.includes('vancouver')
  ) {
    return 'Canada';
  }

  if (
    value.includes('mexico city') ||
    value.includes('guadalajara') ||
    value.includes('monterrey')
  ) {
    return 'Mexico';
  }

  if (
    value.includes('atlanta') ||
    value.includes('arlington') ||
    value.includes('boston') ||
    value.includes('foxborough') ||
    value.includes('houston') ||
    value.includes('inglewood') ||
    value.includes('kansas city') ||
    value.includes('miami') ||
    value.includes('new york') ||
    value.includes('new jersey') ||
    value.includes('philadelphia') ||
    value.includes('san francisco') ||
    value.includes('santa clara') ||
    value.includes('seattle')
  ) {
    return 'USA';
  }

  return '';
}

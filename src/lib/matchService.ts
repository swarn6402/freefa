import { Match, StreamLink } from '@/types';
import { enrichMatchWithApiFootballDetail, enrichMatchesWithApiFootballSchedule } from './apiFootballService';
import { enrichMatchWithEspnEvents, enrichMatchesWithEspnScores } from './espnService';
import { generateFixtures, TEAMS } from './fixtures';
import { enrichMatchesWithOfficialVenues } from './venueEnrichment';
import officialMatchSnapshot from '@/data/worldCup2026MatchesSnapshot.json';
import {
  addStreamLink as addPersistentStreamLink,
  getRecentStreamLinks as getPersistedRecentStreamLinks,
  getStreamLinks as getPersistedStreamLinks,
  getStreamsByMatchIds as getPersistedStreamsByMatchIds,
} from './streamStore';

// In-memory cache
let matchCache: { data: Match[]; timestamp: number } | null = null;
const MATCH_CACHE_TTL_MS = 120 * 1000; // 120 seconds
const FINISHED_STREAM_VISIBLE_MS = 27 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export class MatchDataUnavailableError extends Error {
  constructor(matchId?: string) {
    super(matchId ? `Match data temporarily unavailable for ${matchId}` : 'Match data temporarily unavailable');
    this.name = 'MatchDataUnavailableError';
  }
}

const FLAG_BY_TLA: Record<string, string> = {
  ...Object.fromEntries(Object.values(TEAMS).map((team) => [team.tla, team.flag])),
  ALG: '🇩🇿',
  AUT: '🇦🇹',
  COL: '🇨🇴',
  CPV: '🇨🇻',
  CUW: '🇨🇼',
  CZE: '🇨🇿',
  EGY: '🇪🇬',
  GHA: '🇬🇭',
  HAI: '🇭🇹',
  IRQ: '🇮🇶',
  JOR: '🇯🇴',
  PAR: '🇵🇾',
  RSA: '🇿🇦',
  SCO: '🏴',
  SWE: '🇸🇪',
  SUI: '🇨🇭',
  TUN: '🇹🇳',
  TUR: '🇹🇷',
  URY: '🇺🇾',
  UZB: '🇺🇿',
};

function getFlagForTeam(tla?: string): string {
  if (!tla) return '🏳️';
  return FLAG_BY_TLA[tla] || '🏳️';
}

export async function getAllMatches(): Promise<Match[]> {
  if (matchCache && Date.now() - matchCache.timestamp < MATCH_CACHE_TTL_MS) {
    return matchCache.data;
  }

  try {
    // Try the football-data.org API first (free tier)
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    console.log('[matchService] FOOTBALL_DATA_API_KEY detected:', Boolean(apiKey));

    if (apiKey) {
      const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
      console.log('[matchService] Requesting football-data.org matches:', url);

      const res = await fetch(
        url,
        {
          headers: { 'X-Auth-Token': apiKey },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const mapped = await enrichMatchesWithApiFootballSchedule(
          await enrichMatchesWithOfficialVenues(mapFootballDataMatches(data.matches))
        );
        console.log('[matchService] football-data.org request succeeded:', res.status);
        console.log('[matchService] football-data.org matches returned:', mapped.length);
        const result = await enrichMatchesWithEspnScores(normalizeMatchesForTimeline(mapped));
        matchCache = { data: result, timestamp: Date.now() };
        return result;
      }

      console.warn('[matchService] football-data.org request failed:', res.status, res.statusText);
      return getFallbackMatches('football-data.org request failed');
    } else {
      console.log('[matchService] No football-data.org API key found');
      return getFallbackMatches('missing FOOTBALL_DATA_API_KEY');
    }
  } catch (error) {
    console.error('[matchService] football-data.org request threw an error:', error);
    return getFallbackMatches('football-data.org request threw an error');
  }

  return getFallbackMatches('football-data.org request did not return matches');
}

async function getFallbackMatches(reason: string): Promise<Match[]> {
  if (matchCache) {
    console.warn(`[matchService] ${reason}; using last good match cache`);
    return matchCache.data;
  }

  if (IS_PRODUCTION) {
    console.warn(`[matchService] ${reason}; using bundled official match snapshot`);
    const snapshotMatches = await enrichMatchesWithApiFootballSchedule(
      await enrichMatchesWithOfficialVenues(
        mapFootballDataMatches(officialMatchSnapshot.matches)
      )
    );
    const result = await enrichMatchesWithEspnScores(normalizeMatchesForTimeline(snapshotMatches));
    matchCache = { data: result, timestamp: Date.now() };
    return result;
  }

  // Local development fallback only. Never use generated fixtures in production.
  console.log(`[matchService] ${reason}; using local generated fixtures`);
  const fixtures = generateFixtures();
  const result = await enrichMatchesWithEspnScores(normalizeMatchesForTimeline(fixtures));
  matchCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const matches = await getAllMatches();
  const baseMatch = matches.find((m) => m.id === id) || null;
  if (!baseMatch) {
    if (IS_PRODUCTION && matches.length === 0) {
      throw new MatchDataUnavailableError(id);
    }

    return null;
  }

  const apiFootballMatch = await enrichMatchWithApiFootballDetail(baseMatch);
  return enrichMatchWithEspnEvents(apiFootballMatch);
}

export async function getLiveMatches(): Promise<Match[]> {
  const matches = await getAllMatches();
  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'HALF_TIME');
  return Promise.all(liveMatches.map((match) => enrichMatchWithEspnEvents(match)));
}

export async function getUpcomingMatches(limit = 8): Promise<Match[]> {
  const matches = await getAllMatches();
  const now = new Date();
  return matches
    .filter((m) => m.status === 'SCHEDULED' && new Date(m.utcDate) > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, limit);
}

export async function getFinishedMatches(limit = 6, espnRevalidateSeconds = 60): Promise<Match[]> {
  const matches = await getAllMatches();
  const finishedMatches = matches
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, limit);

  return Promise.all(
    finishedMatches.map((match) =>
      enrichMatchWithEspnEvents(match, { revalidateSeconds: espnRevalidateSeconds })
    )
  );
}

export async function getFeaturedMatch(): Promise<Match | null> {
  const live = await getLiveMatches();
  if (live.length > 0) {
    // Pick the most interesting live match (prefer teams with high ranking)
    return live[0];
  }

  const upcoming = await getUpcomingMatches(1);
  if (upcoming.length > 0) return upcoming[0];

  const finished = await getFinishedMatches(1);
  return finished[0] || null;
}

export async function addStreamLink(link: StreamLink): Promise<boolean> {
  return addPersistentStreamLink(link);
}

export async function getStreamLinks(matchId: string): Promise<StreamLink[]> {
  const streams = await getPersistedStreamLinks(matchId);
  // Visibility is derived from each link's own age rather than the parent match.
  // This keeps the hot path (polled once per live viewer every ~60s) off the
  // expensive getAllMatches() fetch + enrichment, which previously ran on every
  // cold function instance just to read one match's status/kickoff time.
  return filterRecentStreamLinks(streams);
}

function filterRecentStreamLinks(streams: StreamLink[]): StreamLink[] {
  if (streams.length === 0) {
    return streams;
  }

  const now = Date.now();
  return streams.filter((stream) => {
    const addedAt = new Date(stream.addedAt).getTime();
    if (Number.isNaN(addedAt)) {
      return true;
    }

    return now - addedAt <= FINISHED_STREAM_VISIBLE_MS;
  });
}

export async function getRecentStreamLinks(limit?: number): Promise<StreamLink[]> {
  return getPersistedRecentStreamLinks(limit);
}

export async function getMatchWithStreams(match: Match): Promise<Match> {
  return {
    ...match,
    streams: filterVisibleStreamLinks(match, await getPersistedStreamLinks(match.id)),
  };
}

export async function getMatchesWithStreams(matches: Match[]): Promise<Match[]> {
  const streamsByMatchId = await getPersistedStreamsByMatchIds(matches.map((match) => match.id));

  return matches.map((match) => ({
    ...match,
    streams: filterVisibleStreamLinks(match, streamsByMatchId.get(match.id) || []),
  }));
}

function filterVisibleStreamLinks(match: Match, streams: StreamLink[]): StreamLink[] {
  if (streams.length === 0 || shouldShowStreamLinks(match)) {
    return streams;
  }

  return [];
}

function shouldShowStreamLinks(match: Match): boolean {
  if (match.status !== 'FINISHED') {
    return true;
  }

  const kickoff = new Date(match.utcDate).getTime();
  if (Number.isNaN(kickoff)) {
    return false;
  }

  return Date.now() - kickoff <= FINISHED_STREAM_VISIBLE_MS;
}

function normalizeMatchesForTimeline(matches: Match[]): Match[] {
  return matches.map(normalizeMatchStatusForTimeline);
}

function normalizeMatchStatusForTimeline(match: Match): Match {
  if (match.status !== 'SCHEDULED') {
    return match;
  }

  const kickoff = new Date(match.utcDate).getTime();
  if (Number.isNaN(kickoff)) {
    return match;
  }

  const elapsedMs = Date.now() - kickoff;
  if (elapsedMs < 0) {
    return match;
  }

  const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

  return {
    ...match,
    status: elapsedMs < LIVE_WINDOW_MS ? 'LIVE' : 'FINISHED',
    minute: elapsedMs < LIVE_WINDOW_MS ? estimateLiveMinute('LIVE', match.utcDate) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFootballDataTeam(team: any, fallbackId: number) {
  if (!team) {
    return {
      id: fallbackId,
      name: 'TBD',
      shortName: 'TBD',
      tla: 'TBD',
      flag: getFlagForTeam(),
    };
  }

  return {
    id: team.id ?? fallbackId,
    name: team.name || 'TBD',
    shortName: team.shortName || team.name || 'TBD',
    tla: team.tla || 'TBD',
    flag: getFlagForTeam(team.tla),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFootballDataMatches(raw: any[]): Match[] {
  // Map football-data.org format to our Match type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return raw.map((m: any) => ({
    id: String(m.id),
    homeTeam: mapFootballDataTeam(m.homeTeam, -((m.id ?? 0) * 2 + 1)),
    awayTeam: mapFootballDataTeam(m.awayTeam, -((m.id ?? 0) * 2 + 2)),
    status: mapStatus(m.status),
    stage: m.stage || 'GROUP_STAGE',
    group: m.group,
    matchday: m.matchday,
    utcDate: m.utcDate,
    venue: m.venue || 'TBD',
    city: '',
    country: '',
    score: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
    minute: m.minute ?? estimateLiveMinute(mapStatus(m.status), m.utcDate),
    referee: m.referees?.find((ref: { type?: string }) => ref.type === 'REFEREE')?.name,
  }));
}

function mapStatus(raw: string): Match['status'] {
  const map: Record<string, Match['status']> = {
    SCHEDULED: 'SCHEDULED',
    TIMED: 'SCHEDULED',
    IN_PLAY: 'LIVE',
    PAUSED: 'HALF_TIME',
    FINISHED: 'FINISHED',
    POSTPONED: 'POSTPONED',
  };
  return map[raw] || 'SCHEDULED';
}

function estimateLiveMinute(status: Match['status'], utcDate?: string): number | undefined {
  if (status !== 'LIVE' || !utcDate) {
    return undefined;
  }

  const kickoff = new Date(utcDate).getTime();
  if (Number.isNaN(kickoff)) {
    return undefined;
  }

  const elapsedMinutes = Math.floor((Date.now() - kickoff) / (1000 * 60));
  if (elapsedMinutes < 0) {
    return undefined;
  }

  if (elapsedMinutes <= 45) {
    return Math.max(1, elapsedMinutes);
  }

  if (elapsedMinutes <= 60) {
    return 45;
  }

  return Math.min(90, elapsedMinutes - 15);
}

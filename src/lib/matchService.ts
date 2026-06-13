import { Match, StreamLink } from '@/types';
import { enrichMatchWithApiFootballDetail, enrichMatchesWithApiFootballSchedule } from './apiFootballService';
import { generateFixtures, TEAMS } from './fixtures';
import { enrichMatchesWithOfficialVenues } from './venueEnrichment';
import {
  addStreamLink as addPersistentStreamLink,
  getMatchWithStreams as getMatchWithPersistedStreams,
  getMatchesWithStreams as getMatchesWithPersistedStreams,
  getStreamLinks as getPersistedStreamLinks,
} from './streamStore';

// In-memory cache
let matchCache: Match[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

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
  const now = Date.now();

  if (matchCache && now - lastFetchTime < CACHE_TTL) {
    return matchCache;
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
          next: { revalidate: 60 },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const venueEnriched = await enrichMatchesWithOfficialVenues(mapFootballDataMatches(data.matches));
        const mapped = await enrichMatchesWithApiFootballSchedule(venueEnriched);
        console.log('[matchService] football-data.org request succeeded:', res.status);
        console.log('[matchService] football-data.org matches returned:', mapped.length);
        matchCache = mapped;
        lastFetchTime = now;
        return mapped;
      }

      console.warn('[matchService] football-data.org request failed:', res.status, res.statusText);
      console.log('[matchService] Using fallback generated fixtures');
    } else {
      console.log('[matchService] No football-data.org API key found');
      console.log('[matchService] Using fallback generated fixtures');
    }
  } catch (error) {
    console.error('[matchService] football-data.org request threw an error:', error);
    console.log('[matchService] Using fallback generated fixtures');
  }

  // Fall back to generated fixtures
  const fixtures = generateFixtures();
  matchCache = fixtures;
  lastFetchTime = now;
  return fixtures;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const matches = await getAllMatches();
  const match = matches.find((m) => m.id === id) || null;
  if (!match) {
    return null;
  }

  return enrichMatchWithApiFootballDetail(match);
}

export async function getLiveMatches(): Promise<Match[]> {
  const matches = await getAllMatches();
  return matches.filter((m) => m.status === 'LIVE' || m.status === 'HALF_TIME');
}

export async function getUpcomingMatches(limit = 8): Promise<Match[]> {
  const matches = await getAllMatches();
  const now = new Date();
  return matches
    .filter((m) => m.status === 'SCHEDULED' && new Date(m.utcDate) > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, limit);
}

export async function getFinishedMatches(limit = 6): Promise<Match[]> {
  const matches = await getAllMatches();
  return matches
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, limit);
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
  return getPersistedStreamLinks(matchId);
}

export async function getMatchWithStreams(match: Match): Promise<Match> {
  return getMatchWithPersistedStreams(match);
}

export async function getMatchesWithStreams(matches: Match[]): Promise<Match[]> {
  return getMatchesWithPersistedStreams(matches);
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
    minute: m.minute,
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

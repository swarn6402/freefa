import { Match } from '@/types';

type OfficialVenueMatch = {
  utcDate: string;
  stageKey: string;
  teamPairKey: string;
  venue: string;
  city: string;
  country: string;
};

type OfficialVenueIndex = {
  byExactKey: Map<string, OfficialVenueMatch>;
  byStageKey: Map<string, OfficialVenueMatch>;
};

const FIFA_SUITES_EVENTS_URL = 'https://fifaworldcup26.suites.fifa.com/events/';
const VENUE_CACHE_TTL = 24 * 60 * 60 * 1000;

const TIME_ZONE_BY_VENUE: Record<string, string> = {
  'Atlanta Stadium': 'America/New_York',
  'BC Place Vancouver': 'America/Vancouver',
  'Boston Stadium': 'America/New_York',
  'Dallas Stadium': 'America/Chicago',
  'Guadalajara Stadium': 'America/Mexico_City',
  'Houston Stadium': 'America/Chicago',
  'Kansas City Stadium': 'America/Chicago',
  'Los Angeles Stadium': 'America/Los_Angeles',
  'Mexico City Stadium': 'America/Mexico_City',
  'Miami Stadium': 'America/New_York',
  'Monterrey Stadium': 'America/Monterrey',
  'New York New Jersey Stadium': 'America/New_York',
  'Philadelphia Stadium': 'America/New_York',
  'San Francisco Bay Area Stadium': 'America/Los_Angeles',
  'Seattle Stadium': 'America/Los_Angeles',
  'Toronto Stadium': 'America/Toronto',
};

const MANUAL_OFFICIAL_MATCHES: OfficialVenueMatch[] = [
  {
    utcDate: '2026-06-11T19:00:00Z',
    stageKey: 'group-stage',
    teamPairKey: buildTeamPairKey('Mexico', 'South Africa'),
    venue: 'Mexico City Stadium',
    city: 'Mexico City',
    country: 'Mexico',
  },
  {
    utcDate: '2026-06-12T02:00:00Z',
    stageKey: 'group-stage',
    teamPairKey: buildTeamPairKey('Korea Republic', 'Czechia'),
    venue: 'Guadalajara Stadium',
    city: 'Guadalajara',
    country: 'Mexico',
  },
  {
    utcDate: '2026-06-13T01:00:00Z',
    stageKey: 'group-stage',
    teamPairKey: buildTeamPairKey('United States', 'Paraguay'),
    venue: 'Los Angeles Stadium',
    city: 'Inglewood',
    country: 'USA',
  },
];

let venueIndexCache: OfficialVenueIndex | null = null;
let venueIndexFetchedAt = 0;

export async function enrichMatchesWithOfficialVenues(matches: Match[]): Promise<Match[]> {
  if (matches.length === 0) return matches;

  try {
    const venueIndex = await getOfficialVenueIndex();

    return matches.map((match) => {
      const exactKey = `${match.utcDate}|${buildTeamPairKey(match.homeTeam.name, match.awayTeam.name)}`;
      const stageKey = `${match.utcDate}|${normalizeFootballDataStage(match.stage)}`;

      const officialVenue =
        venueIndex.byExactKey.get(exactKey) ||
        (match.stage !== 'GROUP_STAGE' ? venueIndex.byStageKey.get(stageKey) : undefined);

      if (!officialVenue) {
        return match;
      }

      return {
        ...match,
        venue: officialVenue.venue || match.venue,
        city: officialVenue.city || match.city,
        country: officialVenue.country || match.country,
      };
    });
  } catch (error) {
    console.warn('[venueEnrichment] Failed to enrich match venues:', error);
    return matches;
  }
}

async function getOfficialVenueIndex(): Promise<OfficialVenueIndex> {
  const now = Date.now();

  if (venueIndexCache && now - venueIndexFetchedAt < VENUE_CACHE_TTL) {
    return venueIndexCache;
  }

  const venueMatches = await fetchOfficialVenueMatches();
  const byExactKey = new Map<string, OfficialVenueMatch>();
  const byStageKey = new Map<string, OfficialVenueMatch>();

  for (const match of venueMatches) {
    if (match.teamPairKey) {
      byExactKey.set(`${match.utcDate}|${match.teamPairKey}`, match);
    }
    byStageKey.set(`${match.utcDate}|${match.stageKey}`, match);
  }

  venueIndexCache = { byExactKey, byStageKey };
  venueIndexFetchedAt = now;
  return venueIndexCache;
}

async function fetchOfficialVenueMatches(): Promise<OfficialVenueMatch[]> {
  const response = await fetch(FIFA_SUITES_EVENTS_URL, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Official venue fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const blocks = html
    .split('<div class="event_tile_element_container clearfix"')
    .slice(1)
    .map((block) => `<div class="event_tile_element_container clearfix"${block}`);

  const parsedMatches = blocks
    .map(parseVenueBlock)
    .filter((match): match is OfficialVenueMatch => match !== null);

  return [...MANUAL_OFFICIAL_MATCHES, ...parsedMatches];
}

function parseVenueBlock(block: string): OfficialVenueMatch | null {
  const stageKey = block.match(/data-stage="([^"]+)"/i)?.[1];
  const schemaJson = block.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  const matchName =
    stripHtml(block.match(/<span class="event_tile_name">([\s\S]*?)<\/span>/i)?.[1]) ||
    stripHtml(block.match(/data-match-name="([^"]+)"/i)?.[1]);

  if (!stageKey || !schemaJson) {
    return null;
  }

  const schema = JSON.parse(schemaJson) as {
    location?: {
      name?: string;
      address?: {
        addressCountry?: { name?: string };
        addressLocality?: string;
      };
    };
    startDate?: string;
  };

  const venue = schema.location?.name;
  const city = schema.location?.address?.addressLocality;
  const country = normalizeHostCountry(schema.location?.address?.addressCountry?.name);
  const utcDate = parseLocalStartToUtc(schema.startDate, venue);

  if (!venue || !city || !country || !utcDate) {
    return null;
  }

  const teams = matchName.match(/^(?:M\d+:\s*)?(.+?)\s+vs\.\s+(.+)$/i);

  return {
    utcDate,
    stageKey,
    teamPairKey: teams ? buildTeamPairKey(teams[1], teams[2]) : '',
    venue,
    city,
    country,
  };
}

function normalizeFootballDataStage(stage: string): string {
  const stageMap: Record<string, string> = {
    FINAL: 'final',
    GROUP_STAGE: 'group-stage',
    LAST_16: 'round-of-16',
    LAST_32: 'round-of-32',
    QUARTER_FINALS: 'quarter-final',
    SEMI_FINALS: 'semi-final',
    THIRD_PLACE: 'bronze-final',
  };

  return stageMap[stage] || stage.toLowerCase();
}

function buildTeamPairKey(homeTeamName?: string | null, awayTeamName?: string | null): string {
  const teams = [normalizeTeamName(homeTeamName), normalizeTeamName(awayTeamName)]
    .filter(Boolean)
    .sort();

  return teams.join('|');
}

function normalizeTeamName(teamName?: string | null): string {
  const normalized = decodeHtmlEntities(teamName)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

  if (!normalized) return '';
  if (normalized.includes('bosnia') && normalized.includes('her')) return 'bosnia and herzegovina';
  if (normalized.includes('korea')) return 'korea republic';
  if (normalized === 'usa' || normalized.includes('united states')) return 'united states';
  if (normalized.includes('iran')) return 'iran';
  if (normalized.includes('czech')) return 'czechia';
  if (normalized.includes('congo')) return 'dr congo';
  if (normalized.includes('ivoire') || normalized.includes('ivory')) return 'ivory coast';
  if (normalized.includes('cura')) return 'curacao';
  if (normalized.includes('cape verde') || normalized.includes('cabo verde')) return 'cape verde';
  if (normalized.includes('turk') || normalized.includes('turkiye') || normalized.includes('turkiy')) {
    return 'turkey';
  }
  if (normalized.includes('netherlands')) return 'netherlands';

  return normalized;
}

function normalizeHostCountry(country?: string): string {
  if (country === 'U.S.') return 'USA';
  return country || '';
}

function stripHtml(value?: string): string {
  return decodeHtmlEntities(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value?: string | null): string {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&uuml;/g, 'u')
    .replace(/&ccedil;/g, 'c')
    .replace(/&ocirc;/g, 'o')
    .replace(/&eacute;/g, 'e')
    .replace(/&iacute;/g, 'i')
    .replace(/&aacute;/g, 'a')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'");
}

function parseLocalStartToUtc(startDate?: string, venue?: string): string | null {
  if (!startDate || !venue) return null;

  const timeZone = TIME_ZONE_BY_VENUE[venue];
  if (!timeZone) return null;

  const [datePart, timePart] = startDate.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [rawHour, minute] = timePart.slice(0, 5).split(':').map(Number);

  // Convert a local stadium kickoff time into a stable UTC timestamp.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  let utcTimestamp = Date.UTC(year, month - 1, day, rawHour, minute, 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const formattedParts = Object.fromEntries(
      formatter
        .formatToParts(new Date(utcTimestamp))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    );

    const localAsUtc = Date.UTC(
      Number(formattedParts.year),
      Number(formattedParts.month) - 1,
      Number(formattedParts.day),
      Number(formattedParts.hour),
      Number(formattedParts.minute),
      Number(formattedParts.second)
    );

    const targetAsUtc = Date.UTC(year, month - 1, day, rawHour, minute, 0);
    const difference = targetAsUtc - localAsUtc;

    if (difference === 0) {
      break;
    }

    utcTimestamp += difference;
  }

  return new Date(utcTimestamp).toISOString().replace('.000', '');
}

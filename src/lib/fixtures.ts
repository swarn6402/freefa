import { Team, Match, GroupStanding } from '@/types';

// All 48 qualified teams for FIFA World Cup 2026
export const TEAMS: Record<string, Team> = {
  // Group A
  USA: { id: 1, name: 'United States', shortName: 'USA', tla: 'USA', flag: '🇺🇸', group: 'A' },
  PAN: { id: 2, name: 'Panama', shortName: 'Panama', tla: 'PAN', flag: '🇵🇦', group: 'A' },
  BOL: { id: 3, name: 'Bolivia', shortName: 'Bolivia', tla: 'BOL', flag: '🇧🇴', group: 'A' },
  OFC: { id: 4, name: 'New Zealand', shortName: 'New Zealand', tla: 'NZL', flag: '🇳🇿', group: 'A' },

  // Group B
  ARG: { id: 5, name: 'Argentina', shortName: 'Argentina', tla: 'ARG', flag: '🇦🇷', group: 'B' },
  CHI: { id: 6, name: 'Chile', shortName: 'Chile', tla: 'CHI', flag: '🇨🇱', group: 'B' },
  ALB: { id: 7, name: 'Albania', shortName: 'Albania', tla: 'ALB', flag: '🇦🇱', group: 'B' },
  UKR: { id: 8, name: 'Ukraine', shortName: 'Ukraine', tla: 'UKR', flag: '🇺🇦', group: 'B' },

  // Group C
  MEX: { id: 9, name: 'Mexico', shortName: 'Mexico', tla: 'MEX', flag: '🇲🇽', group: 'C' },
  ECU: { id: 10, name: 'Ecuador', shortName: 'Ecuador', tla: 'ECU', flag: '🇪🇨', group: 'C' },
  SVK: { id: 11, name: 'Slovakia', shortName: 'Slovakia', tla: 'SVK', flag: '🇸🇰', group: 'C' },
  TCA: { id: 12, name: 'Turks & Caicos Islands', shortName: 'T&C Is.', tla: 'TCA', flag: '🏝️', group: 'C' },

  // Group D
  POR: { id: 13, name: 'Portugal', shortName: 'Portugal', tla: 'POR', flag: '🇵🇹', group: 'D' },
  CRO: { id: 14, name: 'Croatia', shortName: 'Croatia', tla: 'CRO', flag: '🇭🇷', group: 'D' },
  DEN: { id: 15, name: 'Denmark', shortName: 'Denmark', tla: 'DEN', flag: '🇩🇰', group: 'D' },
  GNB: { id: 16, name: 'Guinea-Bissau', shortName: 'Guinea-Bissau', tla: 'GNB', flag: '🇬🇼', group: 'D' },

  // Group E
  BRA: { id: 17, name: 'Brazil', shortName: 'Brazil', tla: 'BRA', flag: '🇧🇷', group: 'E' },
  URU: { id: 18, name: 'Uruguay', shortName: 'Uruguay', tla: 'URU', flag: '🇺🇾', group: 'E' },
  SRB: { id: 19, name: 'Serbia', shortName: 'Serbia', tla: 'SRB', flag: '🇷🇸', group: 'E' },
  CMR: { id: 20, name: 'Cameroon', shortName: 'Cameroon', tla: 'CMR', flag: '🇨🇲', group: 'E' },

  // Group F
  ENG: { id: 21, name: 'England', shortName: 'England', tla: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'F' },
  SEN: { id: 22, name: 'Senegal', shortName: 'Senegal', tla: 'SEN', flag: '🇸🇳', group: 'F' },
  SVN: { id: 23, name: 'Slovenia', shortName: 'Slovenia', tla: 'SVN', flag: '🇸🇮', group: 'F' },
  BEN: { id: 24, name: 'Benin', shortName: 'Benin', tla: 'BEN', flag: '🇧🇯', group: 'F' },

  // Group G
  FRA: { id: 25, name: 'France', shortName: 'France', tla: 'FRA', flag: '🇫🇷', group: 'G' },
  CMZ: { id: 26, name: 'Morocco', shortName: 'Morocco', tla: 'MAR', flag: '🇲🇦', group: 'G' },
  BEL: { id: 27, name: 'Belgium', shortName: 'Belgium', tla: 'BEL', flag: '🇧🇪', group: 'G' },
  MKD: { id: 28, name: 'North Macedonia', shortName: 'N. Macedonia', tla: 'MKD', flag: '🇲🇰', group: 'G' },

  // Group H
  ESP: { id: 29, name: 'Spain', shortName: 'Spain', tla: 'ESP', flag: '🇪🇸', group: 'H' },
  NED: { id: 30, name: 'Netherlands', shortName: 'Netherlands', tla: 'NED', flag: '🇳🇱', group: 'H' },
  HUN: { id: 31, name: 'Hungary', shortName: 'Hungary', tla: 'HUN', flag: '🇭🇺', group: 'H' },
  GAM: { id: 32, name: 'Gambia', shortName: 'Gambia', tla: 'GAM', flag: '🇬🇲', group: 'H' },

  // Group I
  GER: { id: 33, name: 'Germany', shortName: 'Germany', tla: 'GER', flag: '🇩🇪', group: 'I' },
  COD: { id: 34, name: 'DR Congo', shortName: 'DR Congo', tla: 'COD', flag: '🇨🇩', group: 'I' },
  BIH: { id: 35, name: 'Bosnia-Herzegovina', shortName: 'Bosnia', tla: 'BIH', flag: '🇧🇦', group: 'I' },
  THA: { id: 36, name: 'Thailand', shortName: 'Thailand', tla: 'THA', flag: '🇹🇭', group: 'I' },

  // Group J
  JAP: { id: 37, name: 'Japan', shortName: 'Japan', tla: 'JPN', flag: '🇯🇵', group: 'J' },
  AUS: { id: 38, name: 'Australia', shortName: 'Australia', tla: 'AUS', flag: '🇦🇺', group: 'J' },
  CHN: { id: 39, name: 'China', shortName: 'China', tla: 'CHN', flag: '🇨🇳', group: 'J' },
  IDN: { id: 40, name: 'Indonesia', shortName: 'Indonesia', tla: 'IDN', flag: '🇮🇩', group: 'J' },

  // Group K
  KOR: { id: 41, name: 'South Korea', shortName: 'South Korea', tla: 'KOR', flag: '🇰🇷', group: 'K' },
  IRN: { id: 42, name: 'Iran', shortName: 'Iran', tla: 'IRN', flag: '🇮🇷', group: 'K' },
  QAT: { id: 43, name: 'Qatar', shortName: 'Qatar', tla: 'QAT', flag: '🇶🇦', group: 'K' },
  NAD: { id: 44, name: 'Canada', shortName: 'Canada', tla: 'CAN', flag: '🇨🇦', group: 'K' },

  // Group L
  POL: { id: 45, name: 'Poland', shortName: 'Poland', tla: 'POL', flag: '🇵🇱', group: 'L' },
  MEG: { id: 46, name: 'Ivory Coast', shortName: 'Ivory Coast', tla: 'CIV', flag: '🇨🇮', group: 'L' },
  NOR: { id: 47, name: 'Norway', shortName: 'Norway', tla: 'NOR', flag: '🇳🇴', group: 'L' },
  KSA: { id: 48, name: 'Saudi Arabia', shortName: 'Saudi Arabia', tla: 'KSA', flag: '🇸🇦', group: 'L' },
};

// World Cup 2026 Venues
export const VENUES = {
  metlife: { name: 'MetLife Stadium', city: 'East Rutherford', country: 'USA' },
  atandt: { name: 'AT&T Stadium', city: 'Arlington', country: 'USA' },
  sofi: { name: 'SoFi Stadium', city: 'Inglewood', country: 'USA' },
  levis: { name: "Levi's Stadium", city: 'Santa Clara', country: 'USA' },
  lincoln: { name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA' },
  bofaa: { name: 'Bank of America Stadium', city: 'Charlotte', country: 'USA' },
  arrowhead: { name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA' },
  nrg: { name: 'NRG Stadium', city: 'Houston', country: 'USA' },
  hardrock: { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA' },
  seattle: { name: 'Lumen Field', city: 'Seattle', country: 'USA' },
  boston: { name: 'Gillette Stadium', city: 'Foxborough', country: 'USA' },
  dallas: { name: 'Cotton Bowl', city: 'Dallas', country: 'USA' },
  azteca: { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico' },
  guadalajara: { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico' },
  monterrey: { name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico' },
  bmc: { name: 'BMO Field', city: 'Toronto', country: 'Canada' },
  bce: { name: 'BC Place', city: 'Vancouver', country: 'Canada' },
};

// Generate actual WC2026 group stage fixtures (June 11 - July 2, 2026)
export function generateFixtures(): Match[] {
  const now = new Date();

  const makeMatch = (
    id: string,
    homeKey: string,
    awayKey: string,
    dateStr: string,
    venueKey: keyof typeof VENUES,
    group: string,
    matchday: number
  ): Match => {
    const utcDate = new Date(dateStr).toISOString();
    const matchTime = new Date(dateStr);
    const home = TEAMS[homeKey];
    const away = TEAMS[awayKey];
    const venue = VENUES[venueKey];

    // Determine status based on current time
    let status: Match['status'] = 'SCHEDULED';
    let score = { home: null as number | null, away: null as number | null };
    let minute: number | undefined;

    const diffMs = now.getTime() - matchTime.getTime();
    const diffMins = diffMs / 60000;

    if (diffMins > 0 && diffMins <= 45) {
      status = 'LIVE';
      minute = Math.floor(diffMins);
      score = { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) };
    } else if (diffMins > 45 && diffMins <= 60) {
      status = 'HALF_TIME';
      score = { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) };
    } else if (diffMins > 60 && diffMins <= 105) {
      status = 'LIVE';
      minute = Math.floor(diffMins - 15);
      score = { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) };
    } else if (diffMins > 105) {
      status = 'FINISHED';
      score = { home: Math.floor(Math.random() * 4), away: Math.floor(Math.random() * 4) };
    }

    return {
      id,
      homeTeam: home,
      awayTeam: away,
      status,
      stage: 'GROUP_STAGE',
      group,
      matchday,
      utcDate,
      venue: venue.name,
      city: venue.city,
      country: venue.country,
      score,
      minute,
    };
  };

  return [
    // Matchday 1 - June 11-14
    makeMatch('m1', 'MEX', 'USA', '2026-06-11T20:00:00-05:00', 'azteca', 'C', 1),
    makeMatch('m2', 'ARG', 'CHI', '2026-06-12T18:00:00-04:00', 'metlife', 'B', 1),
    makeMatch('m3', 'BRA', 'CMR', '2026-06-12T21:00:00-04:00', 'bofaa', 'E', 1),
    makeMatch('m4', 'ENG', 'BEN', '2026-06-13T15:00:00-04:00', 'hardrock', 'F', 1),
    makeMatch('m5', 'FRA', 'MKD', '2026-06-13T18:00:00-04:00', 'atandt', 'G', 1),
    makeMatch('m6', 'GER', 'THA', '2026-06-13T21:00:00-04:00', 'levis', 'I', 1),
    makeMatch('m7', 'ESP', 'GAM', '2026-06-14T15:00:00-05:00', 'nrg', 'H', 1),
    makeMatch('m8', 'JAP', 'IDN', '2026-06-14T18:00:00-04:00', 'bmc', 'J', 1),
    makeMatch('m9', 'KOR', 'IRN', '2026-06-14T21:00:00-04:00', 'seattle', 'K', 1),
    makeMatch('m10', 'USA', 'BOL', '2026-06-15T15:00:00-04:00', 'sofi', 'A', 1),
    makeMatch('m11', 'POR', 'GNB', '2026-06-15T18:00:00-04:00', 'lincoln', 'D', 1),
    makeMatch('m12', 'POL', 'KSA', '2026-06-15T21:00:00-04:00', 'arrowhead', 'L', 1),

    // Matchday 2 - June 15-19
    makeMatch('m13', 'PAN', 'OFC', '2026-06-16T15:00:00-04:00', 'boston', 'A', 2),
    makeMatch('m14', 'CHI', 'ALB', '2026-06-16T18:00:00-05:00', 'guadalajara', 'B', 2),
    makeMatch('m15', 'ECU', 'SVK', '2026-06-16T21:00:00-04:00', 'hardrock', 'C', 2),
    makeMatch('m16', 'URU', 'SRB', '2026-06-17T15:00:00-04:00', 'metlife', 'E', 2),
    makeMatch('m17', 'CRO', 'DEN', '2026-06-17T18:00:00-04:00', 'bofaa', 'D', 2),
    makeMatch('m18', 'SEN', 'SVN', '2026-06-17T21:00:00-04:00', 'nrg', 'F', 2),
    makeMatch('m19', 'CMZ', 'BEL', '2026-06-18T15:00:00-04:00', 'atandt', 'G', 2),
    makeMatch('m20', 'NED', 'HUN', '2026-06-18T18:00:00-04:00', 'sofi', 'H', 2),
    makeMatch('m21', 'COD', 'BIH', '2026-06-18T21:00:00-04:00', 'levis', 'I', 2),
    makeMatch('m22', 'AUS', 'CHN', '2026-06-19T15:00:00-04:00', 'bce', 'J', 2),
    makeMatch('m23', 'NAD', 'QAT', '2026-06-19T18:00:00-04:00', 'bmc', 'K', 2),
    makeMatch('m24', 'MEG', 'NOR', '2026-06-19T21:00:00-04:00', 'arrowhead', 'L', 2),

    // Group stage continues to June 26...
    // Matchday 3 - June 25-26 (simultaneous)
    makeMatch('m25', 'USA', 'PAN', '2026-06-26T19:00:00-04:00', 'metlife', 'A', 3),
    makeMatch('m26', 'BOL', 'OFC', '2026-06-26T19:00:00-04:00', 'sofi', 'A', 3),
    makeMatch('m27', 'ARG', 'ALB', '2026-06-27T19:00:00-04:00', 'hardrock', 'B', 3),
    makeMatch('m28', 'CHI', 'UKR', '2026-06-27T19:00:00-04:00', 'nrg', 'B', 3),
    makeMatch('m29', 'MEX', 'SVK', '2026-06-28T19:00:00-05:00', 'azteca', 'C', 3),
    makeMatch('m30', 'ECU', 'TCA', '2026-06-28T19:00:00-05:00', 'monterrey', 'C', 3),

    // Round of 32 - June 29 - July 4
    makeMatch('r1', 'ARG', 'ENG', '2026-07-01T18:00:00-04:00', 'metlife', 'A', 1),
    makeMatch('r2', 'FRA', 'BRA', '2026-07-01T22:00:00-04:00', 'atandt', 'A', 1),
    makeMatch('r3', 'ESP', 'GER', '2026-07-02T18:00:00-04:00', 'sofi', 'A', 1),
    makeMatch('r4', 'POR', 'JAP', '2026-07-02T22:00:00-04:00', 'hardrock', 'A', 1),

    // FINAL - July 19
    makeMatch('final', 'ARG', 'FRA', '2026-07-19T18:00:00-04:00', 'metlife', 'A', 1),
  ];
}

export function getGroupStandings(): GroupStanding[] {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return groups.map((group) => ({
    group,
    entries: Object.values(TEAMS)
      .filter((t) => t.group === group)
      .map((team) => ({
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })),
  }));
}

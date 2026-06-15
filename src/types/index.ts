export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FINISHED' | 'POSTPONED';

export type Stage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string; // Three Letter Abbreviation
  flag: string; // emoji flag
  crest?: string; // URL to crest image
  group?: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface MatchEvent {
  minute: number;
  minuteLabel?: string;
  type: 'GOAL' | 'OWN_GOAL' | 'PENALTY' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  team: 'HOME' | 'AWAY';
  playerName?: string;
  assistName?: string;
}

export interface MatchStatistics {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

export interface StreamLink {
  id: string;
  matchId: string;
  url: string;
  label: string;
  language?: string;
  quality?: string;
  source: string; // Telegram channel name
  addedAt: string; // ISO date
  verified: boolean;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  status: MatchStatus;
  stage: Stage;
  group?: string; // e.g. "Group A"
  matchday?: number;
  utcDate: string; // ISO 8601
  venue: string;
  city: string;
  country: string; // host country: USA, Canada, Mexico
  score: Score;
  halfTimeScore?: Score;
  minute?: number; // live match minute
  events?: MatchEvent[];
  statistics?: MatchStatistics;
  streams?: StreamLink[];
  referee?: string;
}

export interface GroupStanding {
  group: string;
  entries: {
    team: Team;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form?: string[]; // last 5: 'W'|'D'|'L'
  }[];
}

export interface TelegramConfig {
  channels: string[];
  botToken: string;
}

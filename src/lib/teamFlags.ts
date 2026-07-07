import { TEAMS } from './fixtures';

// TLA → emoji flag. Group-stage teams come from the fixtures table (keyed by
// the tla each team actually plays under); the extra entries below cover
// nations that can only appear from the knockout stage onward (via play-offs /
// intercontinental slots) and therefore aren't in the 48-team group table.
export const FLAG_BY_TLA: Record<string, string> = {
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

// Returns the flag emoji for a team's three-letter abbreviation, or the white
// flag (🏳️) when the tla is missing/unknown (i.e. a still-undetermined team).
export function getFlagForTeam(tla?: string): string {
  if (!tla) return '🏳️';
  return FLAG_BY_TLA[tla] || '🏳️';
}

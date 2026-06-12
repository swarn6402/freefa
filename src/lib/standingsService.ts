import { GroupStanding, Match, Team } from '@/types';
import { getAllMatches } from './matchService';

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const COUNTED_STATUSES = new Set<Match['status']>(['FINISHED', 'LIVE', 'HALF_TIME']);

type StandingEntry = GroupStanding['entries'][number];

export async function getGroupStandings(): Promise<GroupStanding[]> {
  const matches = await getAllMatches();
  return buildGroupStandings(matches);
}

export function buildGroupStandings(matches: Match[]): GroupStanding[] {
  const standingsByGroup = new Map<string, Map<string, StandingEntry>>();

  for (const match of matches) {
    if (match.stage !== 'GROUP_STAGE') continue;

    const group = normalizeGroup(match.group);
    if (!group) continue;

    const groupStandings = getOrCreateGroupStandings(standingsByGroup, group);
    const homeEntry = getOrCreateStandingEntry(groupStandings, match.homeTeam);
    const awayEntry = getOrCreateStandingEntry(groupStandings, match.awayTeam);

    if (!COUNTED_STATUSES.has(match.status)) continue;
    if (match.score.home === null || match.score.away === null) continue;

    applyMatchResult(homeEntry, awayEntry, match.score.home, match.score.away);
  }

  const orderedGroups = [
    ...GROUP_ORDER.filter((group) => standingsByGroup.has(group)),
    ...[...standingsByGroup.keys()].filter((group) => !GROUP_ORDER.includes(group)).sort(),
  ];

  return orderedGroups.map((group) => ({
    group,
    entries: [...(standingsByGroup.get(group)?.values() || [])].sort(compareStandings),
  }));
}

function normalizeGroup(group?: string): string | null {
  if (!group) return null;
  return group.startsWith('GROUP_') ? group.replace('GROUP_', '') : group;
}

function getOrCreateGroupStandings(
  standingsByGroup: Map<string, Map<string, StandingEntry>>,
  group: string
): Map<string, StandingEntry> {
  let groupStandings = standingsByGroup.get(group);

  if (!groupStandings) {
    groupStandings = new Map<string, StandingEntry>();
    standingsByGroup.set(group, groupStandings);
  }

  return groupStandings;
}

function getOrCreateStandingEntry(
  groupStandings: Map<string, StandingEntry>,
  team: Team
): StandingEntry {
  const key = String(team.id);
  let entry = groupStandings.get(key);

  if (!entry) {
    entry = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
    groupStandings.set(key, entry);
  }

  return entry;
}

function applyMatchResult(
  homeEntry: StandingEntry,
  awayEntry: StandingEntry,
  homeGoals: number,
  awayGoals: number
): void {
  homeEntry.played += 1;
  awayEntry.played += 1;

  homeEntry.goalsFor += homeGoals;
  homeEntry.goalsAgainst += awayGoals;
  awayEntry.goalsFor += awayGoals;
  awayEntry.goalsAgainst += homeGoals;

  homeEntry.goalDifference = homeEntry.goalsFor - homeEntry.goalsAgainst;
  awayEntry.goalDifference = awayEntry.goalsFor - awayEntry.goalsAgainst;

  if (homeGoals > awayGoals) {
    homeEntry.won += 1;
    awayEntry.lost += 1;
    homeEntry.points += 3;
    return;
  }

  if (homeGoals < awayGoals) {
    awayEntry.won += 1;
    homeEntry.lost += 1;
    awayEntry.points += 3;
    return;
  }

  homeEntry.drawn += 1;
  awayEntry.drawn += 1;
  homeEntry.points += 1;
  awayEntry.points += 1;
}

function compareStandings(a: StandingEntry, b: StandingEntry): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.name.localeCompare(b.team.name);
}

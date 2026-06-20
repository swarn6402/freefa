import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Match } from '@/types';

const DISPLAY_LOCALE = undefined;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchTime(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleTimeString(DISPLAY_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

export function formatMatchDate(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleDateString(DISPLAY_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getCountdown(utcDate: string): string {
  const now = new Date();
  const target = new Date(utcDate);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Now';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function getMatchMinuteDisplay(match: Match): string {
  if (match.status === 'HALF_TIME') return 'HT';
  if (match.status === 'FINISHED') return 'FT';
  if (match.status === 'SCHEDULED') return formatMatchTime(match.utcDate);
  if (match.minute) return `${match.minute}'`;
  return '';
}

export function getStageName(stage: string): string {
  const names: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    ROUND_OF_32: 'Round of 32',
    ROUND_OF_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter-Finals',
    SEMI_FINALS: 'Semi-Finals',
    THIRD_PLACE: '3rd Place',
    FINAL: 'FINAL',
  };
  return names[stage] || stage;
}

export function formatGroupName(group?: string): string | null {
  if (!group) return null;
  if (group.startsWith('GROUP_')) {
    return `Group ${group.replace('GROUP_', '')}`;
  }
  return `Group ${group}`;
}

export function formatMatchStage(match: Pick<Match, 'group' | 'matchday' | 'stage'>): string {
  const groupName = formatGroupName(match.group);
  if (groupName) {
    return match.matchday ? `${groupName} · Matchday ${match.matchday}` : groupName;
  }
  return getStageName(match.stage);
}

export function formatVenueName(venue?: string): string {
  if (!venue || venue === 'TBD') return 'Venue TBA';
  return venue;
}

export function formatMatchLocation(match: Pick<Match, 'city' | 'country'>): string {
  const parts = [match.city, match.country].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return 'Host city TBA';
}

export function isMatchSoon(utcDate: string, minutesThreshold = 60): boolean {
  const now = new Date();
  const matchTime = new Date(utcDate);
  const diffMs = matchTime.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= minutesThreshold * 60 * 1000;
}

export function getScoreDisplay(match: Match): string {
  if (match.status === 'SCHEDULED') return 'vs';
  const h = match.score.home ?? '-';
  const a = match.score.away ?? '-';
  return `${h} - ${a}`;
}

import Fuse from 'fuse.js';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Match, MatchStatus, StreamLink } from '@/types';
import { addStreamLink, getAllMatches, getRecentStreamLinks, getStreamLinks } from './matchService';

const GENERIC_URL_PATTERN = /https?:\/\/[^\s<>"]+/gi;
const RTMP_URL_PATTERN = /rtmp?:\/\/[^\s<>"]+/gi;
const STREAM_URL_HINTS = [
  'm3u8',
  'stream',
  'live',
  'watch',
  'hls',
  'embed',
  'player',
  'play',
  'broadcast',
  'channel',
  'sport',
  'soccer',
  'football',
  'match',
  'tv',
];
const STREAM_CONTEXT_KEYWORDS = [
  'live',
  'stream',
  'watch',
  'kickoff',
  'kick off',
  'kick-off',
  'match',
  'vs',
  'hd',
  'link',
  'links',
];

const KNOWN_STREAM_DOMAINS = [
  'footsterss.pages.dev',
  'toxifyxe.pages.dev',
  'run-machine-hd.pages.dev',
  'fifa26-live.pages.dev',
  'footsters.api-live.workers.dev',
];

// The stream sites are all hosted on Cloudflare Pages/Workers and rotate their
// exact subdomain constantly (toxifyxe → toxifyfoot → …), so the explicit list
// above is always going out of date. Treat the whole hosting suffix as a strong
// signal instead. Telegram invite/post links are already filtered out earlier
// (isTelegramLink), so "join this channel" links never reach here.
const STREAM_HOST_SUFFIXES = ['.pages.dev', '.workers.dev'];

// Team name aliases for fuzzy matching
const TEAM_ALIASES: Record<string, string[]> = {
  USA: ['united states', 'usa', 'america', 'usmnt'],
  ARG: ['argentina', 'arg', 'albiceleste'],
  BRA: ['brazil', 'bra', 'brasil', 'selecao'],
  FRA: ['france', 'fra', 'les bleus'],
  GER: ['germany', 'ger', 'deutschland'],
  ESP: ['spain', 'esp', 'espana', 'la roja'],
  POR: ['portugal', 'por', 'cristiano'],
  ENG: ['england', 'eng', 'three lions'],
  MEX: ['mexico', 'mex', 'el tri'],
  JAP: ['japan', 'jpn', 'japan'],
  KOR: ['south korea', 'kor', 'korea'],
  NED: ['netherlands', 'ned', 'holland', 'oranje'],
  TUN: ['tunisia', 'tun', 'carthage eagles'],
  JPN: ['japan', 'jpn', 'samurai blue'],
  KSA: ['saudi arabia', 'ksa', 'green falcons'],
  CIV: ['ivory coast', 'civ', 'cote divoire', 'elephants'],
  SEN: ['senegal', 'sen', 'lions of teranga'],
  MOR: ['morocco', 'mor', 'atlas lions'],
  CMR: ['cameroon', 'cmr', 'indomitable lions'],
  GHA: ['ghana', 'gha', 'black stars'],
  NGA: ['nigeria', 'nga', 'super eagles'],
  EGY: ['egypt', 'egy', 'pharaohs'],
  ALG: ['algeria', 'alg', 'desert foxes'],
  ZAF: ['south africa', 'zaf', 'bafana bafana'],
  AUS: ['australia', 'aus', 'socceroos'],
  IRN: ['iran', 'irn', 'team melli'],
  QAT: ['qatar', 'qat', 'the maroon'],
  IRQ: ['iraq', 'irq', 'lions of mesopotamia'],
  JOR: ['jordan', 'jor', 'chivalrous'],
  UZB: ['uzbekistan', 'uzb', 'white wolves'],
  COL: ['colombia', 'col', 'los cafeteros'],
  ECU: ['ecuador', 'ecu', 'la tri'],
  URU: ['uruguay', 'uru', 'la celeste'],
  PER: ['peru', 'per', 'la blanquirroja'],
  CHI: ['chile', 'chi', 'la roja'],
  VEN: ['venezuela', 'ven', 'la vinotinto'],
  BOL: ['bolivia', 'bol', 'la verde'],
  CRC: ['costa rica', 'crc', 'los ticos'],
  PAN: ['panama', 'pan', 'los canaleros'],
  HON: ['honduras', 'hon', 'los catrachos'],
  SLV: ['el salvador', 'slv', 'la selecta'],
  CAN: ['canada', 'can', 'les rouges'],
  JAM: ['jamaica', 'jam', 'reggae boyz'],
  HAI: ['haiti', 'hai', 'les grenadiers'],
  TRI: ['trinidad and tobago', 'tri', 'soca warriors'],
  POL: ['poland', 'pol', 'bialo-czerwoni'],
  CZE: ['czech republic', 'cze', 'czechia'],
  AUT: ['austria', 'aut', 'das team'],
  BEL: ['belgium', 'bel', 'red devils'],
  SUI: ['switzerland', 'sui', 'nati'],
  SCO: ['scotland', 'sco', 'tartan army'],
  HUN: ['hungary', 'hun', 'magyars'],
  ALB: ['albania', 'alb', 'red and blacks'],
  SVN: ['slovenia', 'svn', 'zmajceki'],
  SRB: ['serbia', 'srb', 'eagles'],
  ROU: ['romania', 'rou', 'tricolorii'],
  UKR: ['ukraine', 'ukr', 'zhovto-blakytni'],
  TUR: ['turkey', 'tur', 'crescent-stars'],
  GEO: ['georgia', 'geo', 'crusaders'],
};

interface TelegramMessage {
  id: number;
  text: string;
  date: number;
  channel: string;
}

interface TelegramChannelTarget {
  raw: string;
  entity: string | number;
  type: 'username' | 'channel ID';
}

interface MatchSearchCandidate {
  matchId: string;
  terms: string[];
  group: string;
  stage: string;
  status: MatchStatus;
  utcDate: string;
}

export interface TelegramScrapeSummary {
  channelsLoaded: number;
  channelErrors: number;
  messagesFetched: number;
  urlsExtracted: number;
  telegramUrlsDiscarded: number;
  streamsStored: number;
  fallbackStreamsStored: number;
  streamsSkipped: number;
  skippedReason?: string;
}

interface MatchLinkResult {
  streamsStored: number;
  streamsSkipped: number;
}

interface MatchTargetResult {
  matchIds: string[];
  bestScore: number;
  reason: string;
}

const TELEGRAM_MESSAGE_LIMIT = 200;
const MATCH_WINDOW_HOURS = 6;
const GENERIC_LINK_BEFORE_KICKOFF_HOURS = 2;
const GENERIC_LINK_AFTER_KICKOFF_HOURS = 3.5;
const RECENT_STREAM_FALLBACK_HOURS = 12;
const RECENT_STREAM_FALLBACK_LIMIT = 8;
const TELEGRAM_HOSTS = new Set(['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me']);

export async function scrapeTelegramChannels(): Promise<TelegramScrapeSummary> {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const sessionString = process.env.TELEGRAM_SESSION_STRING || '';
  const channelList = process.env.TELEGRAM_CHANNELS || '';

  const summary: TelegramScrapeSummary = {
    channelsLoaded: 0,
    channelErrors: 0,
    messagesFetched: 0,
    urlsExtracted: 0,
    telegramUrlsDiscarded: 0,
    streamsStored: 0,
    fallbackStreamsStored: 0,
    streamsSkipped: 0,
  };

  if (!apiId || !apiHash || !sessionString || !channelList) {
    console.log('[Telegram] Missing API credentials, session, or channels, skipping scrape');
    return {
      ...summary,
      skippedReason: 'missing Telegram credentials, session, or channels',
    };
  }

  const parsedApiId = Number(apiId);
  if (!Number.isInteger(parsedApiId) || parsedApiId <= 0) {
    console.log('[Telegram] TELEGRAM_API_ID is invalid, skipping scrape');
    return {
      ...summary,
      skippedReason: 'invalid TELEGRAM_API_ID',
    };
  }

  const channels = channelList
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map(parseTelegramChannelTarget);
  const allMessages: TelegramMessage[] = [];
  summary.channelsLoaded = channels.length;
  const client = new TelegramClient(new StringSession(sessionString), parsedApiId, apiHash, {
    connectionRetries: 5,
  });

  console.log(
    '[Telegram] Loaded channels from TELEGRAM_CHANNELS:',
    channels.map((channel) => ({
      value: channel.raw,
      type: channel.type,
    }))
  );

  try {
    await client.connect();
    console.log('[Telegram] Telegram login succeeded');

    for (const channel of channels) {
      try {
        console.log(
          `[Telegram] Resolving channel entry "${channel.raw}" as ${channel.type}`
        );
        const messages = await fetchChannelMessages(client, channel);
        const extractedUrlCount = messages.reduce(
          (count, message) => count + extractCandidateLinks(message.text).accepted.length,
          0
        );
        const discardedTelegramUrlCount = messages.reduce(
          (count, message) => count + extractCandidateLinks(message.text).discardedTelegram.length,
          0
        );
        const discardedOtherUrls = messages.flatMap(
          (message) => extractCandidateLinks(message.text).discardedOther
        );
        summary.messagesFetched += messages.length;
        summary.urlsExtracted += extractedUrlCount;
        summary.telegramUrlsDiscarded += discardedTelegramUrlCount;
        console.log(`[Telegram] Messages fetched from ${channel.raw}:`, messages.length);
        console.log(`[Telegram] URLs extracted from ${channel.raw}:`, extractedUrlCount);
        console.log(
          `[Telegram] Telegram invite/post links discarded from ${channel.raw}:`,
          discardedTelegramUrlCount
        );
        if (discardedOtherUrls.length > 0) {
          // Surface non-stream URLs we dropped so a future "missing links"
          // report can be diagnosed from the log instead of guessed at.
          console.log(
            `[Telegram] Non-stream URLs discarded from ${channel.raw}:`,
            [...new Set(discardedOtherUrls)]
          );
        }
        allMessages.push(...messages);
      } catch (err) {
        summary.channelErrors += 1;
        console.error(`[Telegram] Failed to fetch from ${channel.raw}:`, err);
      }
    }

    const matchResult = await matchLinksToFixtures(allMessages);
    summary.streamsStored = matchResult.streamsStored;
    summary.streamsSkipped = matchResult.streamsSkipped;
    summary.fallbackStreamsStored = await backfillActiveMatchesWithRecentStreams();
    return summary;
  } finally {
    await client.disconnect();
  }
}

async function fetchChannelMessages(
  client: TelegramClient,
  channelTarget: TelegramChannelTarget
): Promise<TelegramMessage[]> {
  try {
    const messages = await client.getMessages(channelTarget.entity, {
      limit: TELEGRAM_MESSAGE_LIMIT,
    });

    const mappedMessages = messages.map((message) => ({
      id: message.id,
      text: message.message || message.text || '',
      date: message.date,
      channel: channelTarget.raw,
    }));

    if (
      channelTarget.type === 'username' &&
      channelTarget.raw.toLowerCase() === 'footstersreal'
    ) {
      for (const message of mappedMessages) {
        console.log('[Telegram] Raw message text from Footstersreal:', {
          messageId: message.id,
          text: message.text,
        });
      }
    }

    return mappedMessages;
  } catch (err) {
    console.error(`[Telegram] Channel access error for ${channelTarget.raw}:`, err);
    return [];
  }
}

function parseTelegramChannelTarget(raw: string): TelegramChannelTarget {
  if (/^-?\d+$/.test(raw)) {
    return {
      raw,
      entity: Number(raw),
      type: 'channel ID',
    };
  }

  return {
    raw,
    entity: raw,
    type: 'username',
  };
}

async function matchLinksToFixtures(messages: TelegramMessage[]): Promise<MatchLinkResult> {
  const matches = await getAllMatches();
  const result: MatchLinkResult = {
    streamsStored: 0,
    streamsSkipped: 0,
  };

  for (const message of messages) {
    const { accepted: links, discardedTelegram } = extractCandidateLinks(message.text);
    if (links.length === 0) continue;

    const candidateMatches = getRelevantMatchesForMessage(matches, message.date);
    if (candidateMatches.length === 0) {
      continue;
    }

    const searchIndex: MatchSearchCandidate[] = candidateMatches.map((match) => ({
      matchId: match.id,
      terms: buildMatchSearchTerms(match),
      group: match.group?.toLowerCase() || '',
      stage: match.stage.toLowerCase(),
      status: match.status,
      utcDate: match.utcDate,
    }));

    const fuse = new Fuse(searchIndex, {
      keys: ['terms', 'group', 'stage'],
      threshold: 0.4,
      includeScore: true,
    });

    const targetMatches = findTargetMatchesForMessage(
      message.text,
      message.date,
      searchIndex,
      fuse
    );

    console.log('[Telegram] Extracted stream URLs from message:', links);
    if (discardedTelegram.length > 0) {
      console.log('[Telegram] Discarded Telegram URLs from message:', discardedTelegram);
    }
    console.log(
      '[Telegram] Match candidates:',
      targetMatches.matchIds.length > 0
        ? {
            matchIds: targetMatches.matchIds,
            confidenceScore: targetMatches.bestScore,
            reason: targetMatches.reason,
          }
        : null
    );

    if (targetMatches.matchIds.length > 0 && targetMatches.bestScore < 0.4) {
      for (const [linkIndex, link] of links.entries()) {
        const label = resolveStreamLabel(link, message.channel);
        const detectionText = `${link.label} ${link.url} ${message.text}`;
        for (const matchId of targetMatches.matchIds) {
          const streamLink: StreamLink = {
            id: `${message.channel}_${message.id}_${matchId}_${linkIndex}_${Date.now()}`,
            matchId,
            url: link.url,
            label,
            source: message.channel,
            addedAt: new Date(message.date * 1000).toISOString(),
            verified: false,
            quality: detectQuality(detectionText),
            language: detectLanguage(detectionText),
          };
          const stored = await addStreamLink(streamLink);
          if (stored) {
            result.streamsStored += 1;
          } else {
            result.streamsSkipped += 1;
          }
          console.log('[Telegram] Stream storage result:', {
            url: link.url,
            label,
            matchId,
            confidenceScore: targetMatches.bestScore,
            reason: targetMatches.reason,
            stored,
          });
        }
      }
    } else {
      for (const link of links) {
        result.streamsSkipped += 1;
        console.log('[Telegram] Stream storage result:', {
          url: link.url,
          label: resolveStreamLabel(link, message.channel),
          matchId: targetMatches.matchIds[0] || null,
          confidenceScore: targetMatches.bestScore,
          reason: targetMatches.reason,
          stored: false,
        });
      }
    }
  }

  return result;
}

interface AcceptedLink {
  url: string;
  label: string;
}

function extractCandidateLinks(text: string): {
  accepted: AcceptedLink[];
  discardedTelegram: string[];
  discardedOther: string[];
} {
  // Channels post one link per pair of lines: a human name ("Fox Sports",
  // "M6") on one line and the URL on the next. We walk line-by-line so each
  // URL keeps the label directly above it — the ?id= slug is NOT reliable
  // (channels reuse/mismatch it, e.g. label "Tsn" over ?id=fox-sports).
  const lines = text.split(/\r?\n/);
  const accepted: AcceptedLink[] = [];
  const discardedTelegram: string[] = [];
  const discardedOther: string[] = [];
  const seen = new Set<string>();
  const hasStreamContext = hasStreamContextKeywords(text);
  let pendingLabel = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const urlsInLine = [
      ...(line.match(GENERIC_URL_PATTERN) || []),
      ...(line.match(RTMP_URL_PATTERN) || []),
    ].map(cleanExtractedUrl);

    if (urlsInLine.length === 0) {
      // A non-URL line is the label for the URL(s) that follow it.
      pendingLabel = line;
      continue;
    }

    for (const url of urlsInLine) {
      if (!url || seen.has(url)) continue;
      seen.add(url);

      if (isTelegramLink(url)) {
        discardedTelegram.push(url);
        continue;
      }

      if (!isLikelyStreamLink(url, hasStreamContext)) {
        discardedOther.push(url);
        continue;
      }

      accepted.push({ url, label: cleanStreamLabel(pendingLabel) });
    }

    // Label is consumed once; the next URL must find its own preceding line.
    pendingLabel = '';
  }

  return {
    accepted,
    discardedTelegram,
    discardedOther,
  };
}

// Tidy a label line into a display name, dropping trailing promo emoji/symbols
// and over-long junk. Returns '' when nothing usable remains (caller falls back
// to the ?id= slug, then the channel name).
function cleanStreamLabel(rawLabel: string): string {
  const cleaned = rawLabel
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length > 40) return '';
  return cleaned;
}

// Best display name for a stream: the label line above the URL, else a
// title-cased version of the ?id= slug, else attribution to the channel.
function resolveStreamLabel(link: AcceptedLink, channel: string): string {
  if (link.label) return link.label;

  try {
    const id = new URL(link.url).searchParams.get('id');
    if (id) {
      const pretty = id.replace(/[-_]+/g, ' ').trim();
      if (pretty) return pretty.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    // ignore malformed URLs
  }

  return `Stream from @${channel}`;
}

function isTelegramLink(link: string): boolean {
  try {
    const url = new URL(link);
    return TELEGRAM_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function cleanExtractedUrl(link: string): string {
  return link.trim().replace(/[)\],.;!?]+$/g, '');
}

function hasStreamContextKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return STREAM_CONTEXT_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isLikelyStreamLink(link: string, hasStreamContext: boolean): boolean {
  const lower = link.toLowerCase();
  try {
    const url = new URL(link);
    const hostname = url.hostname.toLowerCase();
    if (KNOWN_STREAM_DOMAINS.includes(hostname)) return true;
    // Any Cloudflare Pages/Workers host is one of the rotating stream sites.
    if (STREAM_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true;
    // Player links carry the channel in a query param, e.g. ?id=fox-sports.
    if (url.searchParams.has('id')) return true;
  } catch {
    // ignore malformed URLs
  }
  return hasStreamContext || STREAM_URL_HINTS.some((hint) => lower.includes(hint));
}

function buildMatchSearchTerms(match: Awaited<ReturnType<typeof getAllMatches>>[number]): string[] {
  return [
    match.homeTeam.name.toLowerCase(),
    match.homeTeam.shortName.toLowerCase(),
    match.homeTeam.tla.toLowerCase(),
    match.awayTeam.name.toLowerCase(),
    match.awayTeam.shortName.toLowerCase(),
    match.awayTeam.tla.toLowerCase(),
    ...(TEAM_ALIASES[match.homeTeam.tla] || []),
    ...(TEAM_ALIASES[match.awayTeam.tla] || []),
  ].map(normalizeSearchText);
}

function getRelevantMatchesForMessage(
  matches: Awaited<ReturnType<typeof getAllMatches>>,
  messageTimestampSeconds: number
) {
  const messageTime = messageTimestampSeconds * 1000;

  return matches.filter((match) => {
    const matchTime = new Date(match.utcDate).getTime();
    const diffHours = Math.abs(matchTime - messageTime) / (1000 * 60 * 60);
    return diffHours <= MATCH_WINDOW_HOURS;
  });
}

function findTargetMatchesForMessage(
  messageText: string,
  messageTimestampSeconds: number,
  searchIndex: MatchSearchCandidate[],
  fuse: Fuse<MatchSearchCandidate>
): MatchTargetResult {
  const normalizedMessage = normalizeSearchText(messageText);
  let bestMatchId: string | null = null;
  let bestScore = Infinity;

  for (const candidate of searchIndex) {
    const score = scoreMessageAgainstMatch(normalizedMessage, candidate.terms);
    if (score < bestScore) {
      bestScore = score;
      bestMatchId = candidate.matchId;
    }
  }

  if (bestMatchId && bestScore < 0.4) {
    return {
      matchIds: [bestMatchId],
      bestScore,
      reason: 'explicit team text match',
    };
  }

  const genericLiveCandidates = searchIndex.filter((candidate) =>
    isGenericLiveCandidate(candidate, messageTimestampSeconds)
  );
  if (genericLiveCandidates.length > 0) {
    return {
      matchIds: [...new Set(genericLiveCandidates.map((candidate) => candidate.matchId))],
      bestScore: 0.35,
      reason: 'generic stream post during live/kickoff window',
    };
  }

  const messageTime = messageTimestampSeconds * 1000;
  const nearestCandidate = [...searchIndex]
    .sort(
      (a, b) =>
        Math.abs(new Date(a.utcDate).getTime() - messageTime) -
        Math.abs(new Date(b.utcDate).getTime() - messageTime)
    )[0];

  if (nearestCandidate) {
    const diffHours =
      Math.abs(new Date(nearestCandidate.utcDate).getTime() - messageTime) / (1000 * 60 * 60);
    if (diffHours <= 2) {
      return {
        matchIds: [nearestCandidate.matchId],
        bestScore: 0.38,
        reason: 'nearest kickoff fallback',
      };
    }
  }

  const fused = fuse.search(normalizedMessage, { limit: 1 });
  if (fused.length > 0) {
    return {
      matchIds: [fused[0].item.matchId],
      bestScore: fused[0].score ?? 1,
      reason: 'fuzzy fallback',
    };
  }

  return {
    matchIds: bestMatchId ? [bestMatchId] : [],
    bestScore,
    reason: 'no confident match',
  };
}

function isGenericLiveCandidate(
  candidate: MatchSearchCandidate,
  messageTimestampSeconds: number
): boolean {
  if (candidate.status === 'LIVE' || candidate.status === 'HALF_TIME') {
    return true;
  }

  if (candidate.status === 'FINISHED' || candidate.status === 'POSTPONED') {
    return false;
  }

  const messageTime = messageTimestampSeconds * 1000;
  const matchTime = new Date(candidate.utcDate).getTime();
  const diffHours = (matchTime - messageTime) / (1000 * 60 * 60);

  return (
    diffHours >= -GENERIC_LINK_AFTER_KICKOFF_HOURS &&
    diffHours <= GENERIC_LINK_BEFORE_KICKOFF_HOURS
  );
}

async function backfillActiveMatchesWithRecentStreams(): Promise<number> {
  const matches = await getAllMatches();
  const activeMatches = matches.filter(isActiveMatch);

  if (activeMatches.length === 0) {
    return 0;
  }

  const recentStreams = (await getRecentStreamLinks(30))
    .filter((stream) => isRecentStream(stream))
    .filter((stream) => !activeMatches.some((match) => match.id === stream.matchId))
    .slice(0, RECENT_STREAM_FALLBACK_LIMIT);

  if (recentStreams.length === 0) {
    console.log('[Telegram] No recent stream links available for live-match fallback');
    return 0;
  }

  let storedCount = 0;

  for (const match of activeMatches) {
    const existingStreams = await getStreamLinks(match.id);
    if (existingStreams.length > 0) {
      continue;
    }

    for (const stream of recentStreams) {
      const stored = await addStreamLink({
        ...stream,
        id: `fallback_${match.id}_${Date.now()}_${storedCount}`,
        matchId: match.id,
        label: 'Live stream',
        source: `recent:${stream.source}`,
        addedAt: new Date().toISOString(),
        verified: false,
      });

      if (stored) {
        storedCount += 1;
      }
    }

    console.log('[Telegram] Live-match fallback stream result:', {
      matchId: match.id,
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      attempted: recentStreams.length,
    });
  }

  return storedCount;
}

function isActiveMatch(match: Match): boolean {
  return match.status === 'LIVE' || match.status === 'HALF_TIME';
}

function isRecentStream(stream: StreamLink): boolean {
  const addedAt = new Date(stream.addedAt).getTime();
  if (Number.isNaN(addedAt)) {
    return false;
  }

  return Date.now() - addedAt <= RECENT_STREAM_FALLBACK_HOURS * 60 * 60 * 1000;
}

function scoreMessageAgainstMatch(messageText: string, terms: string[]): number {
  const uniqueTerms = [...new Set(terms)].filter((term) => term.length >= 3);
  const matches = uniqueTerms.filter((term) => messageText.includes(term));

  if (matches.length >= 2) {
    return 0.1;
  }

  if (matches.length === 1) {
    return 0.32;
  }

  return 1;
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectQuality(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('4k') || lower.includes('2160')) return '4K';
  if (lower.includes('1080') || lower.includes('fhd') || lower.includes('fullhd')) return '1080p';
  if (lower.includes('720') || lower.includes('hd')) return '720p';
  if (lower.includes('480') || lower.includes('sd')) return '480p';
  return 'HD';
}

function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('español') || lower.includes('spanish') || lower.includes('esp')) return 'Spanish';
  if (lower.includes('arabic') || lower.includes('عربي')) return 'Arabic';
  if (lower.includes('french') || lower.includes('français')) return 'French';
  if (lower.includes('portuguese') || lower.includes('português')) return 'Portuguese';
  return 'English';
}

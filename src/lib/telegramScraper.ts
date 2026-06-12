import Fuse from 'fuse.js';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { StreamLink } from '@/types';
import { getAllMatches } from './matchService';
import { addStreamLink } from './matchService';

// Stream link patterns - extended for various streaming formats
const STREAM_LINK_PATTERNS = [
  /https?:\/\/[^\s<>"]+(?:m3u8|stream|live|watch|hls)[^\s<>"]*/gi,
  /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"]*/gi,
  /https?:\/\/[^\s<>"]*\/(?:live|stream|watch)(?:\/[^\s<>"]*)?/gi,
  /https?:\/\/t\.me\/[^\s<>"]*/gi,
  /rtmp?:\/\/[^\s<>"]*/gi,
];

// Team name aliases for fuzzy matching
const TEAM_ALIASES: Record<string, string[]> = {
  USA: ['united states', 'usa', 'us', 'america', 'usmnt'],
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

const TELEGRAM_MESSAGE_LIMIT = 100;
const TELEGRAM_HOSTS = new Set(['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me']);

export async function scrapeTelegramChannels(): Promise<void> {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const sessionString = process.env.TELEGRAM_SESSION_STRING || '';
  const channelList = process.env.TELEGRAM_CHANNELS || '';

  if (!apiId || !apiHash || !sessionString || !channelList) {
    console.log('[Telegram] Missing API credentials, session, or channels, skipping scrape');
    return;
  }

  const parsedApiId = Number(apiId);
  if (!Number.isInteger(parsedApiId) || parsedApiId <= 0) {
    console.log('[Telegram] TELEGRAM_API_ID is invalid, skipping scrape');
    return;
  }

  const channels = channelList
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map(parseTelegramChannelTarget);
  const allMessages: TelegramMessage[] = [];
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
        console.log(`[Telegram] Messages fetched from ${channel.raw}:`, messages.length);
        console.log(`[Telegram] URLs extracted from ${channel.raw}:`, extractedUrlCount);
        console.log(
          `[Telegram] Telegram invite/post links discarded from ${channel.raw}:`,
          discardedTelegramUrlCount
        );
        allMessages.push(...messages);
      } catch (err) {
        console.error(`[Telegram] Failed to fetch from ${channel.raw}:`, err);
      }
    }

    await matchLinksToFixtures(allMessages);
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

async function matchLinksToFixtures(messages: TelegramMessage[]): Promise<void> {
  const matches = await getAllMatches();
  const now = new Date();

  // Only consider matches within 24h window
  const relevantMatches = matches.filter((m) => {
    const matchTime = new Date(m.utcDate);
    const diffHours = Math.abs(matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  });

  // Build a search index
  const searchIndex = relevantMatches.flatMap((match) => [
    {
      matchId: match.id,
      terms: [
        match.homeTeam.name.toLowerCase(),
        match.homeTeam.shortName.toLowerCase(),
        match.homeTeam.tla.toLowerCase(),
        match.awayTeam.name.toLowerCase(),
        match.awayTeam.shortName.toLowerCase(),
        match.awayTeam.tla.toLowerCase(),
        // Add aliases
        ...(TEAM_ALIASES[match.homeTeam.tla] || []),
        ...(TEAM_ALIASES[match.awayTeam.tla] || []),
      ],
    },
  ]);

  const fuse = new Fuse(searchIndex, {
    keys: ['terms'],
    threshold: 0.3,
    includeScore: true,
  });

  for (const message of messages) {
    // Extract stream links from message
    const { accepted: links, discardedTelegram } = extractCandidateLinks(message.text);
    if (links.length === 0) continue;

    // Try to find which match this message is about
    const words = message.text.toLowerCase().split(/\s+/);
    let bestMatchId: string | null = null;
    let bestScore = Infinity;

    for (const word of words) {
      if (word.length < 3) continue;
      const results = fuse.search(word);
      if (results.length > 0 && (results[0].score || 1) < bestScore) {
        bestScore = results[0].score || 1;
        bestMatchId = results[0].item.matchId;
      }
    }

    console.log('[Telegram] Extracted stream URLs from message:', links);
    if (discardedTelegram.length > 0) {
      console.log('[Telegram] Discarded Telegram URLs from message:', discardedTelegram);
    }
    console.log(
      '[Telegram] Match candidate:',
      bestMatchId ? { matchId: bestMatchId, confidenceScore: bestScore } : null
    );

    if (bestMatchId && bestScore < 0.4) {
      for (const link of links) {
        const streamLink: StreamLink = {
          id: `${message.channel}_${message.id}_${Date.now()}`,
          matchId: bestMatchId,
          url: link,
          label: `Stream from @${message.channel}`,
          source: message.channel,
          addedAt: new Date(message.date * 1000).toISOString(),
          verified: false,
          quality: detectQuality(message.text),
          language: detectLanguage(message.text),
        };
        const stored = await addStreamLink(streamLink);
        console.log('[Telegram] Stream storage result:', {
          url: link,
          matchId: bestMatchId,
          confidenceScore: bestScore,
          stored,
        });
      }
    } else {
      for (const link of links) {
        console.log('[Telegram] Stream storage result:', {
          url: link,
          matchId: bestMatchId,
          confidenceScore: bestScore,
          stored: false,
        });
      }
    }
  }
}

function extractCandidateLinks(text: string): {
  accepted: string[];
  discardedTelegram: string[];
} {
  const links: string[] = [];
  for (const pattern of STREAM_LINK_PATTERNS) {
    const matches = text.match(pattern) || [];
    links.push(...matches);
  }

  const deduped = [...new Set(links)];
  const accepted: string[] = [];
  const discardedTelegram: string[] = [];

  for (const link of deduped) {
    if (isTelegramLink(link)) {
      discardedTelegram.push(link);
      continue;
    }

    accepted.push(link);
  }

  return {
    accepted,
    discardedTelegram,
  };
}

function isTelegramLink(link: string): boolean {
  try {
    const url = new URL(link);
    return TELEGRAM_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
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

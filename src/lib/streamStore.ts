import { Match, StreamLink } from '@/types';
import { getSupabaseAdminClient } from './supabaseServer';

const STREAM_LINKS_TABLE = 'stream_links';
const FALLBACK_STREAM_STORE: Map<string, StreamLink[]> = new Map();

interface StreamLinkRow {
  id: string;
  match_id: string;
  url: string;
  label: string;
  language: string | null;
  quality: string | null;
  source: string;
  added_at: string;
  verified: boolean;
}

export async function addStreamLink(link: StreamLink): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return addStreamLinkToMemory(link);
  }

  const existing = await supabase
    .from(STREAM_LINKS_TABLE)
    .select('id')
    .eq('match_id', link.matchId)
    .eq('url', link.url)
    .maybeSingle();

  if (existing.error) {
    console.error('[streamStore] Failed to check for existing stream link:', existing.error);
    return addStreamLinkToMemory(link);
  }

  if (existing.data) {
    return false;
  }

  const insert = await supabase.from(STREAM_LINKS_TABLE).insert(toStreamLinkRow(link));

  if (insert.error) {
    console.error('[streamStore] Failed to persist stream link to Supabase:', insert.error);
    return addStreamLinkToMemory(link);
  }

  safeRevalidateStreamPath(link.matchId);
  return true;
}

export async function getStreamLinks(matchId: string): Promise<StreamLink[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return FALLBACK_STREAM_STORE.get(matchId) || [];
  }

  const result = await supabase
    .from(STREAM_LINKS_TABLE)
    .select('*')
    .eq('match_id', matchId)
    .order('added_at', { ascending: true });

  if (result.error) {
    console.error('[streamStore] Failed to load stream links from Supabase:', result.error);
    return FALLBACK_STREAM_STORE.get(matchId) || [];
  }

  return result.data.map(fromStreamLinkRow);
}

export async function getRecentStreamLinks(limit = 30): Promise<StreamLink[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [...FALLBACK_STREAM_STORE.values()]
      .flat()
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, limit);
  }

  const result = await supabase
    .from(STREAM_LINKS_TABLE)
    .select('*')
    .order('added_at', { ascending: false })
    .limit(limit);

  if (result.error) {
    console.error('[streamStore] Failed to load recent stream links from Supabase:', result.error);
    return [...FALLBACK_STREAM_STORE.values()].flat().slice(0, limit);
  }

  return result.data.map(fromStreamLinkRow);
}

export async function getStreamsByMatchIds(matchIds: string[]): Promise<Map<string, StreamLink[]>> {
  const streamsByMatchId = new Map<string, StreamLink[]>();

  for (const matchId of matchIds) {
    streamsByMatchId.set(matchId, FALLBACK_STREAM_STORE.get(matchId) || []);
  }

  if (matchIds.length === 0) {
    return streamsByMatchId;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return streamsByMatchId;
  }

  const result = await supabase
    .from(STREAM_LINKS_TABLE)
    .select('*')
    .in('match_id', matchIds)
    .order('added_at', { ascending: true });

  if (result.error) {
    console.error('[streamStore] Failed to load stream links by match IDs from Supabase:', result.error);
    return streamsByMatchId;
  }

  for (const row of result.data as StreamLinkRow[]) {
    const stream = fromStreamLinkRow(row);
    const existing = streamsByMatchId.get(stream.matchId) || [];
    streamsByMatchId.set(stream.matchId, [...existing, stream]);
  }

  return streamsByMatchId;
}

export async function getMatchWithStreams(match: Match): Promise<Match> {
  return {
    ...match,
    streams: await getStreamLinks(match.id),
  };
}

export async function getMatchesWithStreams(matches: Match[]): Promise<Match[]> {
  const streamsByMatchId = await getStreamsByMatchIds(matches.map((match) => match.id));

  return matches.map((match) => ({
    ...match,
    streams: streamsByMatchId.get(match.id) || [],
  }));
}

function addStreamLinkToMemory(link: StreamLink): boolean {
  const existing = FALLBACK_STREAM_STORE.get(link.matchId) || [];

  if (existing.find((stream) => stream.url === link.url)) {
    return false;
  }

  FALLBACK_STREAM_STORE.set(link.matchId, [...existing, link]);
  safeRevalidateStreamPath(link.matchId);
  return true;
}

function safeRevalidateStreamPath(matchId: string): void {
  // Imported lazily so this module can run outside Next.js (e.g. the
  // standalone Telegram scraper on GitHub Actions), where `next/cache`
  // has no request context. Fire-and-forget; failures are swallowed.
  void (async () => {
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath(`/match/${matchId}`);
    } catch (error) {
      console.warn('[streamStore] Skipping revalidation outside request context:', error);
    }
  })();
}

function toStreamLinkRow(link: StreamLink): StreamLinkRow {
  return {
    id: link.id,
    match_id: link.matchId,
    url: link.url,
    label: link.label,
    language: link.language || null,
    quality: link.quality || null,
    source: link.source,
    added_at: link.addedAt,
    verified: link.verified,
  };
}

function fromStreamLinkRow(row: StreamLinkRow): StreamLink {
  return {
    id: row.id,
    matchId: row.match_id,
    url: row.url,
    label: row.label,
    language: row.language || undefined,
    quality: row.quality || undefined,
    source: row.source,
    addedAt: row.added_at,
    verified: row.verified,
  };
}

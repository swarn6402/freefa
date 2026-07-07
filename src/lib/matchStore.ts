import { Match } from '@/types';
import { getSupabaseAdminClient } from './supabaseServer';

// A single-row table: one JSON blob holding the whole enriched match list.
// This is the *shared* cache that every Cloudflare Worker isolate reads, so the
// heavy upstream fetch (football-data.org) happens once in the scheduled job
// instead of once per cold isolate. See scripts/refresh-matches.mts.
const MATCHES_CACHE_TABLE = 'matches_cache';
const MATCHES_CACHE_ID = 'wc2026';

interface MatchesCacheRow {
  id: string;
  data: Match[];
  fetched_at: string;
}

/**
 * Read the shared match snapshot written by the scheduled refresh job.
 * Returns null when Supabase isn't configured, the row is missing, or a read
 * fails — callers fall back to the bundled static snapshot in that case.
 */
export async function readMatchesSnapshot(): Promise<Match[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const result = await supabase
    .from(MATCHES_CACHE_TABLE)
    .select('data, fetched_at')
    .eq('id', MATCHES_CACHE_ID)
    .maybeSingle();

  if (result.error) {
    console.error('[matchStore] Failed to read match snapshot from Supabase:', result.error);
    return null;
  }

  const row = result.data as Pick<MatchesCacheRow, 'data' | 'fetched_at'> | null;
  if (!row || !Array.isArray(row.data) || row.data.length === 0) {
    return null;
  }

  return row.data;
}

/**
 * Upsert the enriched match list into the shared snapshot. Called only from the
 * scheduled refresh job (GitHub Actions), never from the request path.
 */
export async function writeMatchesSnapshot(matches: Match[]): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.warn('[matchStore] Supabase not configured; skipping snapshot write');
    return false;
  }

  const result = await supabase.from(MATCHES_CACHE_TABLE).upsert({
    id: MATCHES_CACHE_ID,
    data: matches,
    fetched_at: new Date().toISOString(),
  });

  if (result.error) {
    console.error('[matchStore] Failed to write match snapshot to Supabase:', result.error);
    return false;
  }

  return true;
}

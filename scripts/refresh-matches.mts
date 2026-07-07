// Standalone match-refresh runner — the ONLY caller of football-data.org.
//
// Why this exists: on Cloudflare Workers the in-memory match cache is per-isolate,
// so under traffic every cold isolate used to hit football-data.org itself. That
// constant request rate against the free tier's 10 req/min limit is what got the
// old API key disabled. This job moves that fetch off the edge: it runs on a
// schedule (GitHub Actions), fetches ONCE, fully enriches, and writes the result
// to Supabase. Every Worker isolate then reads that shared snapshot instead of
// calling football-data.org directly.
//
// Run locally:  npm run refresh:matches   (loads creds from .env.local)
// In CI:        creds come from GitHub Actions secrets via env vars.
import nextEnv from '@next/env';
import { fetchAndBuildMatchSnapshot } from '../src/lib/matchService';
import { writeMatchesSnapshot } from '../src/lib/matchStore';

// Mark this as the standalone (non-Next.js) runtime, consistent with the
// Telegram scraper, so any shared code that guards on it behaves correctly.
process.env.SCRAPER_STANDALONE = 'true';

// Load .env.local when present (local runs). No-op in CI, where the real env
// vars are injected directly.
nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const required = ['FOOTBALL_DATA_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[refresh-matches] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('[refresh-matches] Fetching + enriching match snapshot…');
  const matches = await fetchAndBuildMatchSnapshot();
  console.log(`[refresh-matches] Built ${matches.length} matches`);

  const written = await writeMatchesSnapshot(matches);
  if (!written) {
    console.error('[refresh-matches] Failed to persist snapshot to Supabase');
    process.exit(1);
  }

  console.log('[refresh-matches] Snapshot written to Supabase');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[refresh-matches] Failed:', err);
    process.exit(1);
  });

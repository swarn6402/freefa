// Standalone Telegram scraper runner — reuses the app's real scraping logic
// (src/lib/telegramScraper.ts) but runs as a plain Node process so it can live
// on GitHub Actions instead of a serverless cron. Writes stream links straight
// to Supabase, exactly like the old /api/telegram route did.
//
// Run locally:  npm run scrape:telegram   (loads creds from .env.local)
// In CI:        creds come from GitHub Actions secrets via env vars.
import nextEnv from '@next/env';
import type { Match } from '../src/types';
import { getAllMatches } from '../src/lib/matchService';
import { scrapeTelegramChannels } from '../src/lib/telegramScraper';

// Mark this as the standalone (non-Next.js) runtime so streamStore skips
// revalidatePath — it can never work outside a Next request context and would
// otherwise throw a caught-but-noisy Invariant error for every stored link.
process.env.SCRAPER_STANDALONE = 'true';

// Load .env.local when present (local runs). No-op in CI, where the real
// env vars are injected directly — process.env still wins for anything unset.
nextEnv.loadEnvConfig(process.cwd());

// Same window the old serverless route used, so we only connect to Telegram
// when it's worthwhile (a match is live or within the kickoff window).
const SCRAPE_WINDOW_BEFORE_KICKOFF_MS = 15 * 60 * 1000;
const SCRAPE_WINDOW_AFTER_KICKOFF_MS = 3 * 60 * 60 * 1000;

function isLiveMatch(match: Match): boolean {
  return match.status === 'LIVE' || match.status === 'HALF_TIME';
}

function isNearKickoff(match: Match, now: number): boolean {
  if (match.status === 'FINISHED' || match.status === 'POSTPONED') return false;
  const diff = new Date(match.utcDate).getTime() - now;
  return diff >= -SCRAPE_WINDOW_AFTER_KICKOFF_MS && diff <= SCRAPE_WINDOW_BEFORE_KICKOFF_MS;
}

async function shouldScrape(): Promise<{ scrape: boolean; reason: string }> {
  const matches = await getAllMatches();
  const now = Date.now();

  const live = matches.find(isLiveMatch);
  if (live) {
    return { scrape: true, reason: `live: ${live.homeTeam.name} vs ${live.awayTeam.name}` };
  }

  const near = matches.find((m) => isNearKickoff(m, now));
  if (near) {
    return { scrape: true, reason: `kickoff window: ${near.homeTeam.name} vs ${near.awayTeam.name}` };
  }

  return { scrape: false, reason: 'no live or near-kickoff matches' };
}

async function main(): Promise<void> {
  const required = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_SESSION_STRING', 'TELEGRAM_CHANNELS'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[scrape] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const force = process.argv.includes('--force') || process.env.FORCE_SCRAPE === 'true';
  const window = force
    ? { scrape: true, reason: 'forced (--force)' }
    : await shouldScrape();
  if (!window.scrape) {
    console.log(`[scrape] Skipping — ${window.reason}`);
    return;
  }

  console.log(`[scrape] Window active — ${window.reason}`);
  const summary = await scrapeTelegramChannels();
  console.log('[scrape] Done:', JSON.stringify(summary, null, 2));
}

main()
  .then(() => {
    // Exit explicitly: GramJS keeps a background update loop alive that throws
    // a harmless TIMEOUT after disconnect and would otherwise hang the process
    // (and turn the CI run red). The scrape has fully completed by here.
    process.exit(0);
  })
  .catch((err) => {
    console.error('[scrape] Failed:', err);
    process.exit(1);
  });

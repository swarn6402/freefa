// Standalone Telegram scraper runner — reuses the app's real scraping logic
// (src/lib/telegramScraper.ts) but runs as a plain Node process so it can live
// on GitHub Actions instead of a serverless cron. Writes stream links straight
// to Supabase, exactly like the old /api/telegram route did.
//
// Run locally:  npm run scrape:telegram   (loads creds from .env.local)
// In CI:        creds come from GitHub Actions secrets via env vars.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';
import { scrapeTelegramChannels } from '../src/lib/telegramScraper';

// Mark this as the standalone (non-Next.js) runtime so streamStore skips
// revalidatePath — it can never work outside a Next request context and would
// otherwise throw a caught-but-noisy Invariant error for every stored link.
process.env.SCRAPER_STANDALONE = 'true';

// Load .env.local when present (local runs). No-op in CI, where the real
// env vars are injected directly — process.env still wins for anything unset.
nextEnv.loadEnvConfig(process.cwd());

// How wide the "scrape now" window is around each kickoff. Deliberately
// generous on both ends so we never miss live streams:
//   - 90 min BEFORE: channels post links well ahead of kickoff, and this
//     absorbs a match being rescheduled up to ~1.5h earlier than the snapshot.
//   - 4 h AFTER: covers full time + extra time + penalties + post-match link
//     availability, and absorbs kickoff delays.
// A regular match is ~2h long inside a 5.5h window, so even an hour-scale
// reschedule (the snapshot is 103/104 exact vs the live API; the lone diff was
// a 1h move) still lands well within the window. Idle runs outside every
// window make zero external API calls.
const SCRAPE_WINDOW_BEFORE_KICKOFF_MS = 90 * 60 * 1000;
const SCRAPE_WINDOW_AFTER_KICKOFF_MS = 4 * 60 * 60 * 1000;

// Kickoff times are known ahead of time, so the "is anything worth scraping
// right now?" gate reads the bundled fixture snapshot instead of hitting the
// live football-data API. That keeps the every-5-min cadence (fresh links
// during matches) while making idle runs cost zero external API calls — the
// full live fetch still happens later, inside scrapeTelegramChannels(), but
// only once we've decided to actually scrape. The +3h post-kickoff window
// covers the entire live/half-time period, so no separate status check is
// needed. Note: the live fetch would catch reschedules that the static
// snapshot misses; WC fixtures rarely move, and a missed window only delays
// links, it can't affect the website (which reads Supabase independently).
const SCHEDULE_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/data/worldCup2026MatchesSnapshot.json'
);

interface SnapshotMatch {
  utcDate?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
}

function loadScheduledKickoffs(): SnapshotMatch[] {
  try {
    const raw = JSON.parse(readFileSync(SCHEDULE_SNAPSHOT_PATH, 'utf8')) as {
      matches?: SnapshotMatch[];
    };
    return raw.matches ?? [];
  } catch (err) {
    console.error('[scrape] Failed to read fixture snapshot:', err);
    return [];
  }
}

function shouldScrape(): { scrape: boolean; reason: string } {
  const now = Date.now();
  const matches = loadScheduledKickoffs();

  for (const match of matches) {
    if (!match.utcDate) continue;
    const kickoff = new Date(match.utcDate).getTime();
    if (Number.isNaN(kickoff)) continue;

    const diff = kickoff - now;
    if (diff <= SCRAPE_WINDOW_BEFORE_KICKOFF_MS && diff >= -SCRAPE_WINDOW_AFTER_KICKOFF_MS) {
      const label = `${match.homeTeam?.name ?? 'TBD'} vs ${match.awayTeam?.name ?? 'TBD'}`;
      return { scrape: true, reason: `kickoff window: ${label}` };
    }
  }

  return { scrape: false, reason: 'no matches within kickoff window' };
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
    : shouldScrape();
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

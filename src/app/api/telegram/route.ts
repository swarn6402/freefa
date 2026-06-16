import { NextRequest, NextResponse } from 'next/server';
import { Match } from '@/types';
import { getAllMatches } from '@/lib/matchService';
import { scrapeTelegramChannels } from '@/lib/telegramScraper';

const SCRAPE_WINDOW_BEFORE_KICKOFF_MS = 15 * 60 * 1000;
const SCRAPE_WINDOW_AFTER_KICKOFF_MS = 3 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  const manualSecret = req.headers.get('x-cron-secret');
  const expectedAuthHeader = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (
    process.env.CRON_SECRET &&
    authHeader !== expectedAuthHeader &&
    manualSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scrapeWindow = await getActiveScrapeWindow();

    if (!scrapeWindow.shouldScrape) {
      console.log('[Telegram] Skipping scrape:', scrapeWindow.reason);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: scrapeWindow.reason,
      });
    }

    console.log('[Telegram] Scrape window active:', scrapeWindow.reason);
    await scrapeTelegramChannels();
    return NextResponse.json({ success: true, message: 'Telegram channels scraped' });
  } catch (err) {
    console.error('[Telegram scrape error]', err);
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });
  }
}

// Also allow GET for easy manual testing
export async function GET(req: NextRequest) {
  return POST(req);
}

async function getActiveScrapeWindow(): Promise<{ shouldScrape: boolean; reason: string }> {
  const matches = await getAllMatches();
  const now = Date.now();

  const liveMatch = matches.find((match) => isLiveMatch(match));
  if (liveMatch) {
    return {
      shouldScrape: true,
      reason: `live match detected: ${liveMatch.homeTeam.name} vs ${liveMatch.awayTeam.name}`,
    };
  }

  const kickoffWindowMatch = matches.find((match) => isNearKickoff(match, now));
  if (kickoffWindowMatch) {
    return {
      shouldScrape: true,
      reason: `kickoff window active: ${kickoffWindowMatch.homeTeam.name} vs ${kickoffWindowMatch.awayTeam.name}`,
    };
  }

  return {
    shouldScrape: false,
    reason: 'no live or near-kickoff matches',
  };
}

function isLiveMatch(match: Match): boolean {
  return match.status === 'LIVE' || match.status === 'HALF_TIME';
}

function isNearKickoff(match: Match, now: number): boolean {
  if (match.status === 'FINISHED' || match.status === 'POSTPONED') {
    return false;
  }

  const kickoff = new Date(match.utcDate).getTime();
  const diff = kickoff - now;

  return diff >= -SCRAPE_WINDOW_AFTER_KICKOFF_MS && diff <= SCRAPE_WINDOW_BEFORE_KICKOFF_MS;
}

import { NextRequest, NextResponse } from 'next/server';
import { scrapeTelegramChannels } from '@/lib/telegramScraper';

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

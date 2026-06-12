import { NextRequest, NextResponse } from 'next/server';
import { scrapeTelegramChannels } from '@/lib/telegramScraper';

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
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

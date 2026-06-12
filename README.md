# FreeFA

FreeFA is a World Cup 2026 match hub built with Next.js 16. It combines official fixtures, computed group standings, venue enrichment, and Telegram-sourced live stream discovery into a single production-ready web app.

The project was designed as a polished, real-time football product rather than a static tournament tracker. It focuses on clean frontend presentation, resilient data fallbacks, and a backend flow that can ingest stream links on demand when matches go live.

## Highlights

- Official 2026 World Cup fixture ingestion from `football-data.org`
- Venue and host-city enrichment layered on top of fixture data
- Group standings computed from live match results
- Telegram channel scraping via GramJS user sessions
- Stream link persistence in Supabase
- Manual and cron-triggered stream refresh workflow
- Responsive App Router UI built with Next.js 16 and Tailwind CSS 4
- Production deployment on Vercel

## Product Surface

FreeFA currently includes:

- **Homepage:** featured upcoming match, live matches, upcoming fixtures, recent results, and standings snapshot
- **Schedule page:** full fixture listing with stage/group context
- **Standings page:** computed group tables based on available match results
- **Match detail page:** venue, kickoff, status, and stream availability for a specific fixture
- **Telegram ingestion API:** server-side route for scraping configured Telegram channels and storing matched stream links

## Data Pipeline

The application uses a layered data strategy:

1. **Fixtures and results** come from the `football-data.org` World Cup competition feed.
2. **Venue enrichment** fills in stadium and city data using a secondary official venue mapping layer.
3. **Standings** are computed inside the app from match outcomes rather than hardcoded tables.
4. **Telegram scraping** reads recent channel messages, extracts non-Telegram URLs, and attempts to match them to the correct fixture.
5. **Supabase storage** persists validated stream links so they remain available on the site after ingestion.

This design keeps the public site fast while allowing backend ingestion to be triggered when live links actually appear.

## Architecture

### Frontend

- **Framework:** Next.js 16 App Router
- **UI:** React 19, Tailwind CSS 4
- **Motion/UI helpers:** Framer Motion, Radix UI, Lucide icons

### Backend / Server Logic

- **Fixture service:** `src/lib/matchService.ts`
- **Standings engine:** `src/lib/standingsService.ts`
- **Venue enrichment:** `src/lib/venueEnrichment.ts`
- **Telegram scraper:** `src/lib/telegramScraper.ts`
- **Persistent stream storage:** `src/lib/streamStore.ts`
- **Supabase admin client:** `src/lib/supabaseServer.ts`

### External Services

- `football-data.org` for match data
- Telegram via GramJS user sessions for channel access
- Supabase for persistent stream link storage
- Vercel for deployment and scheduled cron execution

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- GramJS
- football-data.org API
- Vercel

## Environment Variables

Create a `.env.local` file in the project root.

```env
FOOTBALL_DATA_API_KEY=your_api_key_here

TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION_STRING=your_session_string_here
TELEGRAM_CHANNELS=channel1,channel2,-1001234567890

CRON_SECRET=your_random_secret_here
ADMIN_SECRET=your_admin_secret_here

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

See [`.env.local.example`](./.env.local.example) for the tracked template.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys.

### 3. Create the Supabase table

Run the SQL in [`supabase/stream_links.sql`](./supabase/stream_links.sql) inside the Supabase SQL editor.

### 4. Generate the Telegram session string

```bash
npm run telegram:session
```

This will prompt for the first login and print a `TELEGRAM_SESSION_STRING` for reuse.

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Telegram Ingestion Workflow

The app is built for a practical match-day workflow:

- Telegram channels are configured through `TELEGRAM_CHANNELS`
- Entries can be either usernames or full numeric Telegram channel IDs
- The scraper ignores Telegram invite/post links and keeps only external stream URLs
- When a match starts and live links appear, you can manually trigger the ingestion endpoint to pull the latest posts

### Manual trigger

Call:

```bash
curl -X GET https://your-domain.com/api/telegram \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

On Vercel, the same route can also be triggered by cron.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run telegram:session
```

## Deployment

FreeFA is set up for Vercel deployment.

### Required production configuration

1. Import the GitHub repository into Vercel
2. Add all environment variables from `.env.local`
3. Ensure Supabase is configured and the `stream_links` table exists
4. Deploy

### Cron

The repository includes a Vercel cron definition in [`vercel.json`](./vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/telegram",
      "schedule": "0 0 * * *"
    }
  ]
}
```

For hobby-tier deployments, the app is also designed to support manual triggering when stream links are posted close to kickoff.

## API Surface

- `GET /api/matches`
- `GET /api/matches/[id]`
- `GET /api/streams?matchId=...`
- `GET /api/telegram`

## Engineering Notes

- Match times are explicitly formatted in `Asia/Kolkata` to avoid UTC-only server rendering differences in production.
- Knockout fixtures without confirmed teams are rendered as `TBD`.
- The app includes fallback generated fixtures if external APIs fail.
- Stream links are stored server-side so they can survive beyond a single scraper run.

## Why This Project Stands Out

This is not just a styled frontend. FreeFA combines:

- third-party sports data ingestion
- computed standings logic
- venue normalization
- Telegram scraping with session-based authentication
- persistent backend storage
- production deployment and cron automation

It is a good example of a full-stack product that mixes UI polish with practical real-time data plumbing.

## Repository Structure

```text
src/
  app/
    api/
    match/
    schedule/
    standings/
  components/
  lib/
  types/
scripts/
supabase/
public/
```

## License

This project is currently unlicensed and intended for personal and portfolio use unless a license is added later.

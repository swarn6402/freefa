# FreeFA

FreeFA is a fan-built World Cup 2026 match hub built with Next.js 16. It combines official fixture data, computed standings, venue enrichment, live match/event overlays, and Telegram-driven stream [...]

It was built to feel like a real product, not a static tournament microsite: fast homepage shell, live match promotion, match detail pages, persistent stream storage, and a lightweight automation f[...]

## What It Does

- Shows the current tournament state across home, schedule, standings, and match detail pages
- Pulls fixtures and results from `football-data.org`
- Computes standings in-app from match results
- Enriches fixtures with venue and host-city data
- Promotes live matches to the homepage hero automatically
- Enriches match detail with goal events and basic live updates
- Scrapes configured Telegram channels for external stream links
- Stores matched stream links in Supabase so they persist beyond a single scrape run
- Runs the website on Cloudflare Workers and automates scraping with GitHub Actions

## Feature Overview

### Homepage

- live match hero when a game is in progress
- upcoming match hero fallback when nothing is live
- live matches section
- upcoming fixtures section
- recent results section
- compact standings snapshot

### Schedule

- full fixture list
- grouped by date/stage
- stream badge per match
- knockout placeholders rendered as `TBD` where teams are not known yet

### Standings

- all group tables
- computed from fetched match results rather than hardcoded data

### Match Detail

- score and match status
- venue / host city
- kickoff time
- stream links for that fixture
- match events such as goals, cards, and substitutions when available

## Data Sources

FreeFA uses a layered data strategy so the site remains useful even when one provider is limited.

### 1. `football-data.org`

Primary source for:

- World Cup 2026 fixtures
- official match IDs
- match status
- base scores
- stage / group / matchday metadata

### 2. venue enrichment layer

The app applies an internal venue mapping layer on top of fixture data to fill host stadium and city details more consistently.

### 3. ESPN public scoreboard

Used as a free enrichment layer for:

- finished and live match event overlays
- extra score/state reconciliation
- additional venue detail when available

### 4. API-Football

Optional enrichment layer for:

- detailed live match events
- additional statistics
- venue / referee enrichment

Note: access depends on your API-Football plan. The code supports it, but some free plans may not expose the 2026 World Cup season.

### 5. Telegram + GramJS

Used for:

- reading recent messages from configured public channels
- extracting external stream links
- ignoring Telegram invite/post links
- matching discovered links to fixtures near the live kickoff window

### 6. Supabase

Used for:

- persistent `stream_links` storage
- deduplication by `(match_id, url)`
- serving stream links back to the app after ingestion

## Architecture

### Frontend

- **Framework:** Next.js 16 App Router
- **UI:** React 19 + Tailwind CSS 4
- **Components:** Radix UI, Lucide, Framer Motion

### Backend / Server Logic

- [src/lib/matchService.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/matchService.ts)  
  Core match ingestion, fallback behavior, and match composition
- [src/lib/standingsService.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/standingsService.ts)  
  Group table computation
- [src/lib/venueEnrichment.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/venueEnrichment.ts)  
  Venue and city normalization
- [src/lib/espnService.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/espnService.ts)  
  Free event enrichment
- [src/lib/apiFootballService.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/apiFootballService.ts)  
  Optional premium enrichment path
- [src/lib/telegramScraper.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/telegramScraper.ts)  
  Channel loading, message parsing, URL extraction, and fixture matching
- [src/lib/streamStore.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/lib/streamStore.ts)  
  Persistent stream storage and targeted revalidation

### Rendering Strategy

The app uses a hybrid model:

- static shell for major pages with longer `revalidate` windows
- client-side feeds for fast-changing homepage/live sections
- targeted revalidation for match pages when stream links are added

This keeps the site responsive while keeping Cloudflare Worker requests and KV-backed ISR writes modest.

## Project Structure

```text
src/
  app/
    api/
      matches/
      streams/
      telegram/
    match/[id]/
    schedule/
    standings/
  components/
    layout/
    match/
    stream/
    ui/
  lib/
  types/

scripts/
  create-telegram-session.mjs
  trigger-telegram.bat

supabase/
  stream_links.sql

.github/workflows/
  telegram-scrape.yml
```

## Environment Variables

Create a `.env.local` file in the project root.

```env
# Match data
FOOTBALL_DATA_API_KEY=your_api_key_here

# Optional match enrichment
API_FOOTBALL_KEY=your_api_football_key_here

# Telegram user-session credentials
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION_STRING=your_session_string_here
TELEGRAM_CHANNELS=Footstersreal,-1002281665422,-1001533565122

# Protected scrape trigger for the legacy/manual API route
CRON_SECRET=your_random_secret_here

# Optional manual stream insertion endpoint
ADMIN_SECRET=your_admin_secret_here

# Persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Optional app URL metadata
NEXT_PUBLIC_APP_URL=https://wc2026.freefa.workers.dev
```

Reference template: [`.env.local.example`](./.env.local.example)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

### 3. Create the Supabase table

Run the SQL in [supabase/stream_links.sql](./supabase/stream_links.sql) inside the Supabase SQL editor.

### 4. Create a Telegram session string

```bash
npm run telegram:session
```

This performs the first GramJS login flow and prints a reusable `TELEGRAM_SESSION_STRING`.

### 5. Start the app

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Telegram Ingestion Flow

FreeFA does not use a Telegram bot token. It uses a Telegram user session via GramJS.

### Input sources

`TELEGRAM_CHANNELS` supports:

- channel usernames such as `Footstersreal`
- numeric Telegram channel IDs such as `-1001533565122`

### What the scraper does

1. logs into Telegram with `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and `TELEGRAM_SESSION_STRING`
2. fetches recent messages from each configured channel
3. extracts external URLs
4. discards Telegram invite/post links
5. matches URLs to likely nearby fixtures
6. stores valid links in Supabase for the matched `match_id`

### Manual trigger

The primary scraper runs as a standalone GitHub Actions job. You can run the same path locally:

```bash
npm run scrape:telegram
```

You can force a local scrape even outside the live/kickoff window:

```bash
npm run scrape:telegram -- --force
```

The legacy/manual API route can also trigger scraping when deployed in an environment that supports GramJS:

```bash
curl -X GET https://your-domain.com/api/telegram \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

The route also accepts:

```bash
Authorization: Bearer YOUR_CRON_SECRET
```

For local Windows use, there is also a helper script:

- [scripts/trigger-telegram.bat](c:/Users/swarn/Downloads/wc2026/wc2026/scripts/trigger-telegram.bat)

## Automation

The project uses GitHub Actions as the primary scheduler for scraping.

### GitHub Actions scheduler

Workflow file:

- [.github/workflows/telegram-scrape.yml](c:/Users/swarn/Downloads/wc2026/wc2026/.github/workflows/telegram-scrape.yml)

Behavior:

- runs every 5 minutes
- can also be launched manually with `workflow_dispatch`
- runs `npm run scrape:telegram` directly in Node
- writes matched stream links to Supabase

Required GitHub secrets:

- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_SESSION_STRING`
- `TELEGRAM_CHANNELS`
- `FOOTBALL_DATA_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Optional GitHub secret:

- `API_FOOTBALL_KEY`

### Legacy Vercel cron

[vercel.json](c:/Users/swarn/Downloads/wc2026/wc2026/vercel.json) still contains the old daily `/api/telegram` cron for the Vercel fallback deployment. The current Cloudflare/GitHub Actions setup does not depend on it.

### Built-in safety check

Before the Telegram scraper logs in, both [scripts/scrape-telegram.mts](c:/Users/swarn/Downloads/wc2026/wc2026/scripts/scrape-telegram.mts) and [src/app/api/telegram/route.ts](c:/Users/swarn/Downloads/wc2026/wc2026/src/app/api/telegram/route.ts) check whether there is:

- a live match, or
- a near-kickoff window

If not, the scraper exits early. This keeps automation light on free-tier infrastructure.

## API Surface

### `GET /api/matches`

Returns match data. Supports:

- `status=FINISHED`
- `limit=number`

### `GET /api/matches/[id]`

Returns a single enriched match object.

### `GET /api/streams?matchId=...`

Returns stored stream links for a match.

### `POST /api/streams`

Manual protected endpoint for adding a stream link.

Header:

- `x-api-secret: ADMIN_SECRET`

### `GET` / `POST /api/telegram`

Protected scrape trigger endpoint.

Headers:

- `x-cron-secret: CRON_SECRET`
- or `Authorization: Bearer CRON_SECRET`

## Deployment

FreeFA's current production website is deployed to Cloudflare Workers through OpenNext.

### Production checklist

1. install dependencies with `npm install`
2. create the Supabase table from `supabase/stream_links.sql`
3. create/configure the Cloudflare KV namespace bound as `NEXT_INC_CACHE_KV`
4. add Worker secrets with `npx wrangler secret put`
5. add the Telegram/Supabase secrets to GitHub Actions
6. deploy the website with `npm run deploy`

Important: keep the production build on Webpack (`next build --webpack`). Turbopack output caused Worker runtime chunk-loading failures with OpenNext.

### Current page revalidation

- `/` -> `1h`
- `/standings` -> `1h`
- `/schedule` -> `1d`
- `/match/[id]` -> `45s`

This balance keeps the shell stable while leaving live surfaces reactive.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run preview
npm run deploy
npm run cf-typegen
npm run telegram:session
npm run scrape:telegram
```

## Engineering Notes

- Match times are rendered in the viewer's local browser timezone.
- Production falls back to the bundled official match snapshot if external match APIs fail; local development can use generated fixtures.
- Stream revalidation is scoped to the affected match page instead of broad site-wide invalidation.
- Live homepage sections use client-side fetching to reduce unnecessary ISR churn.
- The scraper intentionally ignores Telegram-native links and keeps only external stream targets.
- Stream links for finished matches are hidden from the public app after roughly 27 hours.

## Contributing

Issues and pull requests are welcome, especially around:

- stronger fixture-to-message matching
- better live event enrichment
- mobile UI polish
- improved accessibility
- test coverage for ingestion and match selection

If you open a PR, keep changes focused and avoid unrelated refactors.

## Disclaimer

FreeFA is an independent fan project and is not affiliated with FIFA, ESPN, Telegram, API-Football, football-data.org, or Supabase.

Any trademarks, tournament names, team marks, or third-party services referenced in the project remain the property of their respective owners.

## License

This project is licensed under the [MIT License](./LICENSE).

For detailed information about third-party services, dependencies, and attributions, see [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

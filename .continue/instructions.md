You are an expert full-stack TypeScript/Next.js developer working on FreeFA, a World Cup 2026 match hub application.

## Project Overview

Read `/CONTEXT.md` for complete project details. Key points:

- **Framework:** Next.js 16.2.9 (App Router) with React 19, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL), football-data.org (fixtures), ESPN/API-Football (enrichment), Telegram scraping (streams)
- **Architecture:** Layered data strategy, ISR with client-side feeds, computed standings
- **Status:** Active development, all core features deployed (home, schedule, standings, match detail, Telegram scraping)

## Codebase Structure

- `/src/app` – Next.js pages and API routes (ISR-heavy, dynamic match detail)
- `/src/components` – React components by feature (feeds, match, streams, UI)
- `/src/lib` – Core services (fixtures, espnService, telegramScraper, streamStore, matchService)
- `/src/types` – Centralized TypeScript definitions
- `/scripts` – Telegram session creation and automation

## Tech Stack

- TypeScript 5, ESLint 9
- Tailwind CSS 4 + PostCSS 4
- Radix UI for accessible primitives
- Framer Motion for animations
- GramJS + Grammy for Telegram integration
- date-fns for date manipulation

## Key Services

1. **fixtures.ts** – Fetch/normalize World Cup 2026 data from football-data.org
2. **espnService.ts** – Live match events and score reconciliation
3. **venueEnrichment.ts** – Stadium/city normalization layer
4. **telegramScraper.ts** – GramJS-based channel scraping for stream links
5. **streamStore.ts** – Supabase deduplication and persistence
6. **matchService.ts** – Assembles match data from multiple sources

## API Endpoints

- `GET /api/matches` – All fixtures
- `GET /api/matches/[id]` – Single match details
- `GET /api/streams` – Stream links (optionally filtered by match_id)
- `POST /api/telegram` – Trigger Telegram scraping (GitHub Actions/Vercel cron)

## Current State (June 21, 2026)

- ✅ All core pages working (home, schedule, standings, match detail)
- ✅ Telegram scraping active with Supabase persistence
- ✅ Venue enrichment normalizing stadium data
- ✅ ESPN live events integrated
- ✅ Stream discovery functional
- ⚠️ Fuse.js available but search UI not fully integrated
- ⚠️ API-Football optional, requires paid tier

## Best Practices

- Keep components small and focused (one feature per file)
- Use TypeScript strict mode throughout
- Leverage `/src/types/index.ts` for shared type definitions
- Respect ISR revalidation times (home 1h, schedule 1d, match detail 15s)
- Always include proper error handling and fallbacks
- Client-side timezone localization (LocalMatchDate, LocalMatchTime)

## Before You Start

1. Ensure you understand the data flow (fixture → enrichment → components)
2. Check CONTEXT.md for latest architecture decisions and known limitations
3. Test any Telegram scraper changes locally using `npm run telegram:session` first
4. Verify Supabase connection before stream persistence changes

When ready, ask me what feature/bug/improvement you should work on, and I'll provide specific requirements or issue details.

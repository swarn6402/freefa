# FreeFA - Project Context

**Repository:** `swarn6402/freefa`  
**Project:** FreeFA - FIFA World Cup 2026 Match Hub  
**Version:** 0.1.0  
**Status:** Active Development  
**Last Updated:** June 2026

---

## Executive Summary

FreeFA is a fan-built, Next.js-powered World Cup 2026 match hub that combines official fixture data, computed standings, venue enrichment, live match overlays, and Telegram-driven stream discovery. It was built as a complete product experience rather than a static tournament microsite, featuring fast homepage rendering, live match promotion, persistent stream storage, and automated Telegram scraping.

---

## Tech Stack

### Frontend

- **Framework:** Next.js 16.2.9 (App Router)
- **Runtime:** React 19.2.4
- **Styling:** Tailwind CSS 4 + PostCSS 4
- **Component Library:** Radix UI (Dialog, Separator, Slot)
- **Icons:** Lucide React 1.17.0
- **Animation:** Framer Motion 12.40.0
- **Utilities:** clsx, class-variance-authority, tailwind-merge
- **Date:** date-fns 4.4.0
- **Search:** Fuse.js 7.4.2

### Backend & Integration

- **Database:** Supabase (PostgreSQL-based, persistent stream storage)
- **Primary API:** football-data.org (fixture data, official match IDs)
- **Enrichment APIs:**
  - ESPN public scoreboard (live events, free layer)
  - API-Football (optional premium enrichment)
- **Telegram Integration:**
  - GramJS (`telegram` 2.26.22)
  - Grammy 1.43.0
  - node-telegram-bot-api 0.67.0
- **Analytics:** Vercel Analytics 2.0.1

### Development & Deployment

- **Language:** TypeScript 5
- **Linting:** ESLint 9 + eslint-config-next
- **Deployment:** Vercel (with edge functions, ISR, cron jobs)
- **CI/CD:** GitHub Actions (Telegram scrape automation)
- **Node Types:** @types/node 20, @types/react 19, @types/react-dom 19

---

## Architecture Overview

### Multi-Layer Data Strategy

FreeFA uses a **layered enrichment model** to maintain data quality and availability:

1. **Primary Source (football-data.org)**
   - Official World Cup 2026 fixtures
   - Match IDs, status, scores, stage/group/matchday metadata
   - Baseline source of truth

2. **Venue Enrichment Layer**
   - Internal mapping of stadiums and host cities
   - Consistent stadium/city normalization across providers

3. **ESPN Free Enrichment**
   - Live match events (goals, cards, substitutions)
   - Score reconciliation for finished/live matches
   - Additional venue detail when available

4. **API-Football Premium Enrichment** (optional)
   - Detailed live match statistics
   - Extended event overlays
   - Requires paid API plan

5. **Telegram + GramJS Stream Discovery**
   - Scrapes public Telegram channels for external stream links
   - Extracts URLs and filters Telegram-native links
   - Matches links to fixtures within kickoff windows

6. **Supabase Persistence**
   - Stores matched stream links with `(match_id, url)` deduplication
   - Survives scrape cycles; links persist in the app

### Rendering Strategy

**Hybrid ISR + Client-Side Approach:**

| Page           | Revalidate | Strategy                           |
| -------------- | ---------- | ---------------------------------- |
| `/` (Homepage) | 1h         | Static shell + client-side feeds   |
| `/standings`   | 1h         | Static with computed tables        |
| `/schedule`    | 1d         | Static fixture list                |
| `/match/[id]`  | 15s        | Dynamic with targeted revalidation |

- **Static shells** keep major pages fast and stable
- **Client-side feeds** (hero, live matches, recent results) refresh independently without burning ISR quota

---

## Project Structure & File Organization

### Root Files

- **`next.config.ts`** – Next.js configuration with custom build/runtime settings
- **`tsconfig.json`** – TypeScript configuration
- **`tailwind.config.mjs`** – Tailwind CSS configuration
- **`postcss.config.mjs`** – PostCSS pipeline setup
- **`eslint.config.mjs`** – ESLint linting rules
- **`vercel.json`** – Vercel deployment configuration with edge functions and cron jobs
- **`package.json`** – Dependencies and NPM scripts
- **`next-env.d.ts`** – Auto-generated Next.js type definitions

### `/public`

- **`images/`** – Static assets (flags, logos, tournament imagery)

### `/src/app`

Next.js App Router pages and API routes:

- **`page.tsx`** – Homepage (ISR 1h): hero feed, live matches, recent results, standings snapshot
- **`layout.tsx`** – Root layout wrapper
- **`globals.css`** – Global styles and Tailwind directives
- **`apple-icon.tsx`** – Apple favicon
- **`schedule/page.tsx`** – Schedule page (ISR 1d): full fixture list grouped by date/stage
- **`standings/page.tsx`** – Standings page (ISR 1h): all group standings computed from results
- **`match/[id]/page.tsx`** – Match detail page (ISR 15s): score, venue, kickoff time, streams, events
- **`api/matches/route.ts`** – GET endpoint for fetching fixture data
- **`api/matches/[id]/route.ts`** – GET endpoint for single match details
- **`api/streams/route.ts`** – GET endpoint for stream links associated with a match
- **`api/telegram/route.ts`** – POST endpoint triggered by GitHub Actions or Vercel cron for Telegram scraping

### `/src/components`

React components organized by feature:

#### Layout Components (`layout/`)

- **`Header.tsx`** – Navigation header with branding and links
- **`BrandMark.tsx`** – FreeFA logo/branding component

#### Feed Components (Homepage)

- **`FeaturedHeroFeed.tsx`** – Dynamic hero section (live match or upcoming match)
- **`LiveMatchesFeed.tsx`** – Section showing all currently live matches
- **`RecentResultsFeed.tsx`** – Section showing recently finished matches
- **`ScheduleMatchesFeed.tsx`** – Compact upcoming fixtures section

#### Match Components (`match/`)

- **`HeroMatch.tsx`** – Featured match hero display (used on homepage and match detail)
- **`MatchCard.tsx`** – Compact match card (used in feeds and schedule)
- **`MatchDetailView.tsx`** – Full match detail page layout
- **`MatchDetailRecovery.tsx`** – Error/fallback component for match detail
- **`MatchSection.tsx`** – Reusable match section container
- **`ScoreDisplay.tsx`** – Score display with match status badge
- **`StandingsTable.tsx`** – Group standings table

#### Stream Components (`stream/`)

- **`StreamPanel.tsx`** – Panel displaying stream links for a match

#### UI Components (`ui/`)

- **`CountdownTimer.tsx`** – Countdown to match kickoff
- **`FlagIcon.tsx`** – Country flag icon component (uses country codes)
- **`LiveBadge.tsx`** – Badge indicating a match is live
- **`LocalMatchDate.tsx`** – Match date formatted to user's local timezone
- **`LocalMatchTime.tsx`** – Match time formatted to user's local timezone

#### Other Components

- **`StreamBadge.tsx`** – Small badge indicating if a match has streams available

### `/src/lib`

Core services and utilities:

#### API & Data Services

- **`apiFootballService.ts`** – Integration with API-Football premium endpoints (optional enrichment)
- **`espnService.ts`** – ESPN public scoreboard integration (free live events and scores)
- **`fixtures.ts`** – Fixture fetching and normalization from football-data.org
- **`matchService.ts`** – Match-level data assembly (combines multiple sources)
- **`standingsService.ts`** – Standings computation from match results

#### Telegram & Stream Integration

- **`telegramScraper.ts`** – GramJS-based Telegram channel scraper for external stream links
- **`streamStore.ts`** – Supabase stream link persistence and deduplication logic

#### Database & Infrastructure

- **`supabaseServer.ts`** – Supabase client initialization and server-side helper functions

#### Enrichment & Utilities

- **`venueEnrichment.ts`** – Venue/stadium/city mapping and normalization
- **`utils.ts`** – General utility functions (date formatting, string helpers, etc.)

### `/src/types`

- **`index.ts`** – Centralized TypeScript type definitions for matches, fixtures, standings, streams, venues, etc.

### `/src/data`

- **`worldCup2026MatchesSnapshot.json`** – Fallback fixture snapshot (used if primary API is unavailable)

### `/scripts`

Automation and tooling:

- **`create-telegram-session.mjs`** – Creates persistent Telegram session file for GramJS authentication
- **`trigger-telegram.bat`** – Windows batch script to manually trigger Telegram scraping

### `/supabase`

Database schema:

- **`stream_links.sql`** – Schema for `stream_links` table with deduplication constraints

---

## Core Services & Responsibilities

### Data Flow

```
football-data.org (fixtures, official IDs)
         ↓
    fixtures.ts (fetch & normalize)
         ↓
    venueEnrichment.ts (add stadium/city)
         ↓
    espnService.ts (enrich with live events)
         ↓
    matchService.ts (assemble final match data)
         ↓
    [components consume via API routes]
```

### Telegram Scraping Flow

```
GitHub Actions or Vercel cron
         ↓
    /api/telegram route
         ↓
    telegramScraper.ts (GramJS scrape channels)
         ↓
    streamStore.ts (deduplicate & store in Supabase)
         ↓
    /api/streams route (serves cached links)
```

### API Routes

| Route               | Method | Purpose                                                           |
| ------------------- | ------ | ----------------------------------------------------------------- |
| `/api/matches`      | GET    | Returns all World Cup 2026 fixtures                               |
| `/api/matches/[id]` | GET    | Returns detailed info for a single match                          |
| `/api/streams`      | GET    | Returns all streams in database (optionally filtered by match_id) |
| `/api/telegram`     | POST   | Triggers Telegram scraping (called by scheduler)                  |

---

## Implementation Status

### Fully Implemented ✅

- **Homepage** – Live/upcoming hero, feeds, standings snapshot
- **Schedule Page** – Full fixture list with grouping and stream badges
- **Standings Page** – Computed group tables from match results
- **Match Detail Page** – Score, venue, kickoff, streams, match events
- **Telegram Scraping** – GramJS-based channel monitoring with Supabase persistence
- **Stream Deduplication** – URL-based deduplication by match_id
- **Venue Enrichment** – Stadium/city normalization layer
- **ESPN Integration** – Live event and score enrichment
- **Timezone Localization** – Client-side date/time conversion
- **API Football Integration** – Optional premium enrichment layer
- **Vercel Deployment** – Edge functions, ISR, cron jobs configured
- **Analytics** – Vercel Analytics integrated

### Partial / In Development

- **Search/Filter** – Fuse.js imported but not fully integrated into UI
- **Stream Link Discovery** – Telegram scraping works but may need channel/keyword tuning

### Known Limitations

- **API-Football** – Requires paid plan; free tiers may not expose 2026 season
- **Telegram Scraping** – Requires valid phone number and session file; subject to Telegram rate limiting
- **Fixture Data** – Knockout teams are `TBD` until groups stage is resolved
- **ESPN Events** – Free layer may have latency during peak live match times

---

## Development Workflow

### Local Development

```bash
npm install
npm run dev
# Server runs on http://localhost:3000
```

### Scripts

```bash
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run telegram:session  # Create Telegram session file
```

### Manual Telegram Scraping

Windows:

```bash
scripts\trigger-telegram.bat
```

Linux/Mac:

```bash
curl -X POST http://localhost:3000/api/telegram
```

### Deployment

```bash
git push  # Triggers GitHub Actions, pushes to Vercel
```

Vercel automatically:

1. Builds and deploys on every push
2. Runs cron job daily to scrape Telegram (backup to GitHub Actions)
3. Uses edge functions for API routes where beneficial

---

## Key Architectural Decisions

1. **Layered Data Strategy** – Multiple API sources provide fallback redundancy
2. **ISR with Client Feeds** – Static page shells + client-side refreshing feeds balance performance and staleness
3. **Computed Standings** – Calculated from match results rather than hardcoded, ensures consistency
4. **Supabase Persistence** – Stream links survive across scrape cycles and are deduped by URL
5. **Timezone Localization** – All match times rendered client-side for user's local timezone
6. **Telegram GramJS** – Direct channel scraping bypasses API rate limits (requires session auth)
7. **Vercel Cron + GitHub Actions** – Dual automation ensures scraping happens reliably

---

## Environment Variables Required

Example `.env.local`:

```
NEXT_PUBLIC_FOOTBALL_DATA_KEY=your_football_data_org_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_API_FOOTBALL_KEY=your_api_football_key

# Telegram (if running scraper locally)
TELEGRAM_SESSION_FILE=telegram_session.json
TELEGRAM_CHANNELS=channel1,channel2,channel3
```

---

## Recent State Summary (as of June 21, 2026)

**Current Date:** June 21, 2026 (early in World Cup 2026 tournament)

- All core pages (home, schedule, standings, match detail) are functional and deployed
- Telegram scraping is active and persisting streams in Supabase
- Venue enrichment layer is normalizing stadium/city data consistently
- ESPN live event integration is providing real-time match overlays
- Stream discovery is working and matches are showing available links
- Analytics are tracked via Vercel
- No critical blockers; ongoing maintenance and feature refinement

---

## Next Steps & Potential Improvements

- Enhance Telegram channel tuning (keyword filtering, channel list optimization)
- Add advanced search/filter UI (Fuse.js is available but not exposed)
- Expand API-Football integration for premium users
- Add user preferences/bookmarking for favorite teams
- Implement notifications for live match starts
- Add more detailed player statistics and team info
- Optimize image loading and caching strategies
- **Targeted revalidation** on match pages when streams are added (no broad site invalidation)

### Service Layer Architecture

```
src/lib/
├── matchService.ts          // Core match ingestion, composition, caching
├── standingsService.ts      // Group table computation from results
├── venueEnrichment.ts       // Stadium/city normalization
├── espnService.ts           // Free event enrichment
├── apiFootballService.ts    // Premium enrichment (optional)
├── telegramScraper.ts       // Channel loading, URL extraction, fixture matching
├── streamStore.ts           // Supabase integration & revalidation
├── fixtures.ts              // Generated fixture fallbacks
└── supabaseServer.ts        // Server-side Supabase client
```

---

## Major Features

### 1. Homepage (`/`)

- **Live Match Hero:** Dynamically promotes currently live matches
- **Upcoming Match Hero Fallback:** Shows next fixture when nothing is live
- **Live Matches Section:** Real-time match updates via client-side fetch
- **Upcoming Fixtures:** Next scheduled matches
- **Recent Results:** Latest finished matches with scores
- **Compact Standings Snapshot:** Group tables at a glance

### 2. Schedule (`/schedule`)

- Full fixture list grouped by date and stage
- Stream badge indicator per match
- Knockout placeholders rendered as "TBD" for unknown opponents
- Timezone-aware kickoff times (currently Asia/Kolkata)

### 3. Standings (`/standings`)

- All group tables (A through H)
- Computed from fetched match results (not hardcoded)
- Includes points, goal differential, form tracking

### 4. Match Detail (`/match/[id]`)

- Live score display with match status
- Venue and host city information
- Kickoff time with countdown timer
- Stream links (from Telegram discovery)
- Match events (goals, cards, substitutions) when available
- Live minute indicator for in-progress matches

### 5. Telegram Stream Discovery (API-Driven)

- Automated scraping via `/api/telegram` endpoint
- Matches Telegram links to fixtures within ±6 hour kickoff windows
- Persistent storage prevents duplicate ingestion
- Scheduled via GitHub Actions (15 min) with daily Vercel cron backup
- Safety check: only scrapes during live/near-kickoff windows (free tier efficiency)

---

## Project Structure

```
wc2026/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── matches/
│   │   │   │   ├── route.ts         // GET /api/matches (with filters)
│   │   │   │   └── [id]/route.ts    // GET /api/matches/[id]
│   │   │   ├── streams/
│   │   │   │   └── route.ts         // GET/POST stream links
│   │   │   └── telegram/
│   │   │       └── route.ts         // GET/POST scrape trigger (protected)
│   │   ├── match/
│   │   │   └── [id]/page.tsx        // Match detail page
│   │   ├── schedule/
│   │   │   └── page.tsx             // Schedule page
│   │   ├── standings/
│   │   │   └── page.tsx             // Standings page
│   │   ├── layout.tsx               // Root layout
│   │   ├── page.tsx                 // Homepage
│   │   └── apple-icon.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── BrandMark.tsx
│   │   ├── match/
│   │   │   ├── HeroMatch.tsx        // Featured match display
│   │   │   ├── MatchCard.tsx        // Reusable match card
│   │   │   ├── MatchSection.tsx     // Match detail sections
│   │   │   ├── ScoreDisplay.tsx     // Score rendering
│   │   │   └── StandingsTable.tsx   // Group standings table
│   │   ├── stream/
│   │   │   └── StreamPanel.tsx      // Stream link display
│   │   ├── FeaturedHeroFeed.tsx     // Homepage hero feed (client-side)
│   │   ├── LiveMatchesFeed.tsx      // Live matches section (client-side)
│   │   ├── ScheduleMatchesFeed.tsx  // Schedule section
│   │   ├── RecentResultsFeed.tsx    // Recent results section
│   │   ├── StreamBadge.tsx          // Stream indicator badge
│   │   └── ui/
│   │       ├── LiveBadge.tsx        // "LIVE" indicator
│   │       ├── CountdownTimer.tsx   // Kickoff countdown
│   │       └── FlagIcon.tsx         // Country flags (emojis)
│   ├── lib/
│   │   ├── matchService.ts          // ⭐ Core match logic
│   │   ├── standingsService.ts      // Group computation
│   │   ├── venueEnrichment.ts       // Stadium/city mapping
│   │   ├── espnService.ts           // Free event enrichment
│   │   ├── apiFootballService.ts    // Premium enrichment
│   │   ├── telegramScraper.ts       // ⭐ Stream discovery
│   │   ├── streamStore.ts           // ⭐ Supabase integration
│   │   ├── fixtures.ts              // Generated fallback fixtures
│   │   ├── supabaseServer.ts        // Supabase client setup
│   │   └── utils.ts                 // Utility functions
│   └── types/
│       └── index.ts                 // ⭐ Core type definitions
├── scripts/
│   ├── create-telegram-session.mjs  // Session generation script
│   └── trigger-telegram.bat         // Windows trigger helper
├── supabase/
│   └── stream_links.sql             // Database schema
├── .github/workflows/
│   └── telegram-scrape.yml          // GitHub Actions scheduler
├── public/                          // Static assets
├── .next/                           // Build output
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.mjs
├── postcss.config.mjs
├── eslint.config.mjs
├── vercel.json                      // Cron jobs config
├── .env.local.example               // Environment template
├── README.md                        // User documentation
├── CLAUDE.md                        // Next.js 16 compatibility notes
└── LICENSE                          // MIT License
```

---

## API Surface

### Match Endpoints

**`GET /api/matches`**

- Returns array of all matches
- Query parameters:
  - `status=FINISHED` — filter by status
  - `limit=10` — limit result count
- Returns: `Match[]`

**`GET /api/matches/[id]`**

- Returns single enriched match
- Includes streams, events, and statistics if available
- Returns: `Match`

### Stream Endpoints

**`GET /api/streams?matchId=...`**

- Returns array of stored stream links for a match
- Returns: `StreamLink[]`

**`POST /api/streams`**

- Manual protected endpoint for adding stream links
- Required header: `x-api-secret: ADMIN_SECRET`
- Body: `{ matchId, url, label?, language?, quality?, source? }`
- Returns: `{ success: boolean }`

### Telegram/Scrape Endpoints

**`GET /api/telegram`** or **`POST /api/telegram`**

- Protected scrape trigger endpoint
- Required headers (one of):
  - `x-cron-secret: CRON_SECRET`
  - `Authorization: Bearer CRON_SECRET`
- Behavior:
  - Checks for live or near-kickoff matches
  - Exits early if no active window (free tier optimization)
  - Scrapes configured Telegram channels
  - Matches links to fixtures
  - Stores in Supabase
- Returns: `{ message: string, processed: number }`

---

## Environment Variables

### Required

| Variable                   | Purpose                                               | Example                        |
| -------------------------- | ----------------------------------------------------- | ------------------------------ |
| `FOOTBALL_DATA_API_KEY`    | Match data from football-data.org                     | `abc123xyz`                    |
| `TELEGRAM_API_ID`          | Telegram app ID (from my.telegram.org)                | `123456`                       |
| `TELEGRAM_API_HASH`        | Telegram app hash                                     | `abc123...`                    |
| `TELEGRAM_SESSION_STRING`  | User session string (from `npm run telegram:session`) | `<long string>`                |
| `TELEGRAM_CHANNELS`        | Comma-separated channel names/IDs to scrape           | `Footstersreal,-1002281665422` |
| `CRON_SECRET`              | Protects `/api/telegram` endpoint                     | `your_random_secret`           |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL                                  | `https://xyz.supabase.co`      |
| `SUPABASE_SERVICE_KEY`     | Server-side Supabase key                              | `eyJhbGc...`                   |

### Optional

| Variable              | Purpose                      | Default    |
| --------------------- | ---------------------------- | ---------- |
| `API_FOOTBALL_KEY`    | Premium match enrichment     | (disabled) |
| `ADMIN_SECRET`        | Protects `/api/streams` POST | (disabled) |
| `NEXT_PUBLIC_APP_URL` | App URL for OG tags          | (unset)    |

---

## Current Status

### ✅ Completed Features

- Core match fetching and composition
- Group standings computation
- Venue enrichment layer
- ESPN event enrichment (free)
- Telegram scraping pipeline with GramJS
- Persistent stream storage in Supabase
- Homepage with live match promotion
- Schedule, standings, and match detail pages
- Automated GitHub Actions scheduler (15-min interval)
- Vercel cron backup (daily)
- Deployment-ready on Vercel Hobby tier

### 🚀 Deployment Status

- **Latest Commit:** "Update README License section with MIT license and third-party notices reference"
- **Branch:** `main` (up to date with origin/main)
- **Working Tree:** Clean (no uncommitted changes)
- **License:** MIT

### 📋 Known Limitations & Considerations

1. **No Test Coverage**
   - No unit or integration tests (glob search found zero test files)
   - Recommendation: Add test coverage for:
     - Match composition and enrichment logic
     - Telegram URL extraction and fixture matching
     - Stream deduplication logic
     - Standings computation

2. **Timezone Hard-Coded**
   - All match times rendered in `Asia/Kolkata` timezone
   - Should be configurable or user-selectable for broader audiences

3. **API-Football Plan Limitations**
   - Free plans may not expose World Cup 2026 season
   - Features gracefully fall back to ESPN enrichment

4. **Free Tier Optimization Trade-off**
   - Vercel ISR quota is limited on Hobby tier
   - Current revalidation windows (1h homepage, 1d schedule) are conservative
   - More aggressive revalidation may hit quota limits

5. **Telegram Session Management**
   - Session strings must be manually generated via `npm run telegram:session`
   - Requires interactive Telegram login (two-factor auth if enabled)
   - Session expiry not automatically handled

6. **No Authentication**
   - Admin/cron endpoints protected only by shared secrets (no user auth)
   - Suitable for personal/team use; not for multi-tenant scenarios

### 🐛 Known Issues

- **None documented** in code (no TODO/FIXME comments found)
- No issues tracked in GitHub (not visible from local repo)

---

## Important Files & Modules

### Core Services (Backend Logic)

**`src/lib/matchService.ts`** ⭐⭐⭐

- Entry point for all match data
- Fetches from football-data.org
- Caches matches for 60 seconds in memory
- Orchestrates enrichment pipeline (ESPN, API-Football, venue, streams)
- Applies fallback fixture logic if fetch fails
- Flag emoji mapping for all teams

**`src/lib/telegramScraper.ts`** ⭐⭐⭐

- Loads public Telegram channels via GramJS
- Extracts external URLs from recent messages
- Filters out Telegram-native links (t.me, etc.)
- Matches URLs to fixtures within ±6 hour kickoff windows
- Returns structured stream list for persistence

**`src/lib/streamStore.ts`** ⭐⭐

- Wraps Supabase client for stream operations
- Deduplicates streams by `(match_id, url)`
- Triggers targeted revalidation on match pages when streams added
- Prevents ISR quota waste from broad invalidation

**`src/lib/standingsService.ts`**

- Computes group tables from match results
- Calculates points, goal differential, form
- Not hardcoded; recalculates from live data

**`src/lib/venueEnrichment.ts`**

- Internal stadium/city name normalization
- Ensures consistent venue data across sources
- Handles edge cases and aliases

**`src/lib/espnService.ts`**

- Free enrichment via ESPN public scoreboard
- Extracts live events (goals, cards, subs)
- Fallback when API-Football unavailable

**`src/lib/apiFootballService.ts`**

- Optional premium enrichment
- Detailed statistics and event data
- Gracefully skipped if key missing

**`src/lib/fixtures.ts`**

- Pre-generated World Cup 2026 fixture list
- Fallback if football-data.org unreachable
- Ensures site remains useful during API downtime

### Type Definitions

**`src/types/index.ts`** ⭐

- `Match` — central data model
- `Team`, `Score`, `MatchEvent`, `MatchStatistics`, `StreamLink`
- `Stage`, `MatchStatus`
- `GroupStanding`
- Ensures type safety across entire app

### API Routes

**`src/app/api/matches/route.ts`**

- Query endpoint for match filtering
- Supports status and limit parameters

**`src/app/api/matches/[id]/route.ts`**

- Single match enrichment endpoint
- Returns fully composed Match object

**`src/app/api/streams/route.ts`**

- Stream link CRUD
- Admin secret protected for POST

**`src/app/api/telegram/route.ts`** ⭐⭐

- Scrape trigger endpoint
- Checks for live/near-kickoff window
- Calls telegramScraper and streamStore
- Protected by CRON_SECRET

### Pages

**`src/app/page.tsx`** (Homepage)

- Root page with featured hero and feed components
- Client-side feed fetches for live updates

**`src/app/match/[id]/page.tsx`** (Match Detail)

- Dynamic match detail page
- Stream links, events, venue, countdown

**`src/app/schedule/page.tsx`** (Schedule)

- Full fixture list
- Grouped by stage and date

**`src/app/standings/page.tsx`** (Standings)

- Group tables for A–H
- Computed standings

### Components

**`src/components/FeaturedHeroFeed.tsx`** ⭐⭐

- Homepage hero (client-side fetch)
- Promotes live match or upcoming fixture

**`src/components/LiveMatchesFeed.tsx`** ⭐⭐

- Live matches section (client-side)
- Updates independently from page ISR

**`src/components/RecentResultsFeed.tsx`**

- Recent results section
- Finished matches with scores

**`src/components/ScheduleMatchesFeed.tsx`**

- Upcoming fixtures display

**`src/components/match/HeroMatch.tsx`**

- Featured match card layout

**`src/components/match/MatchCard.tsx`**

- Reusable match card (score, teams, time)

**`src/components/match/StandingsTable.tsx`**

- Group standings table rendering

**`src/components/stream/StreamPanel.tsx`**

- Stream link display on match detail

### Configuration & Scripts

**`vercel.json`**

- Cron job definition: `/api/telegram` once daily

**`.github/workflows/telegram-scrape.yml`**

- GitHub Actions: runs `/api/telegram` every 15 minutes
- Can be manually triggered via `workflow_dispatch`
- Requires `CRON_SECRET` in GitHub Actions secrets

**`scripts/create-telegram-session.mjs`**

- Interactive Telegram login script
- Generates `TELEGRAM_SESSION_STRING`

**`scripts/trigger-telegram.bat`**

- Windows helper to manually call `/api/telegram`

**`supabase/stream_links.sql`**

- Database schema for persistent streams
- Must be created once per Supabase project

---

## Development Workflow

### Local Setup

1. Clone repo and install: `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in credentials
3. Generate Telegram session: `npm run telegram:session`
4. Create Supabase table from `supabase/stream_links.sql`
5. Start dev server: `npm run dev`

### Available Scripts

- `npm run dev` — Start Next.js dev server
- `npm run build` — Build for production
- `npm run start` — Run production build
- `npm run lint` — Run ESLint
- `npm run telegram:session` — Generate Telegram session string

### Testing the Telegram Scraper

- Manual trigger (with CRON_SECRET):
  ```bash
  curl -H "x-cron-secret: YOUR_SECRET" https://localhost:3000/api/telegram
  ```
- Or use Windows helper: `scripts/trigger-telegram.bat`

### Deployment to Vercel

1. Import repo to Vercel
2. Add all environment variables
3. Create Supabase table
4. Add `CRON_SECRET` to GitHub Actions secrets
5. Deploy

---

## Detailed Data Flow Workflows

### 1. **Match Data Ingestion & Composition Workflow**

```
[User Request]
    ↓
[matchService.getAllMatches()]
    ├─ Check in-memory cache (TTL: 60s)
    ├─ If expired or miss:
    │   ├─ Fetch from football-data.org API
    │   ├─ Map to internal Match format
    │   ├─ Apply venue enrichment (venueEnrichment.ts)
    │   ├─ Cache result for 60 seconds
    │   └─ Return enriched matches
    └─ Fallback to generated fixtures if API fails

[Individual Match Enrichment]
    ├─ For LIVE/FINISHED: fetch ESPN events (espnService.ts)
    └─ Optional: fetch API-Football detail (apiFootballService.ts)

[Stream Attachment]
    ├─ Query Supabase for stored stream links
    ├─ Fallback to in-memory stream store if no Supabase
    └─ Return Match with streams[] populated
```

### 2. **Telegram Stream Discovery Workflow**

```
[Scheduled Trigger]
    ├─ GitHub Actions: every 15 minutes
    └─ Vercel Cron: daily backup

[POST /api/telegram]
    ├─ Verify CRON_SECRET header
    ├─ Check for live or near-kickoff matches
    │   ├─ LIVE/HALF_TIME → proceed
    │   ├─ SCHEDULED within ±15min → proceed
    │   └─ Otherwise → skip (free tier optimization)
    └─ Call scrapeTelegramChannels()

[scrapeTelegramChannels()]
    ├─ Connect to Telegram with GramJS user session
    ├─ For each configured channel:
    │   ├─ Fetch 200 recent messages
    │   ├─ Extract URLs (regex: https?:// and rtmp://)
    │   ├─ Filter out Telegram-native links (t.me, telegram.me)
    │   └─ Log extraction results
    └─ Call matchLinksToFixtures()

[matchLinksToFixtures()]
    ├─ Build match search index from live/near-kickoff matches
    ├─ For each extracted URL:
    │   ├─ Score message against match terms (team names, TLA, aliases)
    │   ├─ Detect quality (4K, 1080p, 720p, 480p, HD)
    │   ├─ Detect language (Spanish, Arabic, French, Portuguese, English)
    │   ├─ If confidence score < 0.4:
    │   │   ├─ Create StreamLink object
    │   │   └─ Call addStreamLink() → Supabase insert
    │   └─ If duplicate (match_id, url) → skip
    └─ Trigger targeted revalidation on match pages

[Stream Storage & Revalidation]
    ├─ Check Supabase for existing (match_id, url)
    ├─ If new:
    │   ├─ Insert into stream_links table
    │   ├─ Revalidate only /match/[matchId]
    │   └─ Avoid broad site revalidation
    └─ If duplicate → return false (no action)
```

### 3. **Homepage & Standings Computation Workflow**

```
[GET /]
    ├─ Server-side (revalidate: 3600s)
    │   ├─ getUpcomingMatches(9)
    │   ├─ getFinishedMatches(1, 3600)
    │   └─ getGroupStandings()
    └─ Client-side (FeaturedHeroFeed, LiveMatchesFeed)
        ├─ Refresh every 30s (hero)
        ├─ Fetch /api/matches (cache: no-store)
        └─ Pick live → upcoming → finished

[Standings Computation]
    ├─ Get all GROUP_STAGE matches
    ├─ Filter to FINISHED/LIVE/HALF_TIME
    ├─ Build points table:
    │   ├─ Win: 3 points
    │   ├─ Draw: 1 point
    │   └─ Loss: 0 points
    ├─ Calculate goal differential
    ├─ Sort by (points desc, goal diff desc, goals for desc)
    └─ Return GroupStanding[] for all groups A-H
```

### 4. **Match Detail Page Workflow**

```
[GET /match/[id]]
    ├─ revalidate: 15s (fast updates when streams added)
    ├─ getMatchById(id)
    │   ├─ Find in getAllMatches()
    │   ├─ Enrich with ESPN events
    │   └─ Optionally enrich with API-Football
    ├─ getMatchWithStreams()
    │   ├─ Query Supabase for stream_links
    │   └─ Attach to match.streams[]
    └─ Render with live status, score, events, streams
```

---

## Important Workflows & Patterns

### **In-Memory Caching Pattern**

```typescript
// matchService.ts
let matchCache: Match[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

// Benefits:
// - Reduces API calls during concurrent requests
// - 60s TTL balances freshness vs. efficiency
// - Transparent fallback to generated fixtures
```

### **Targeted ISR Revalidation**

```typescript
// streamStore.ts
function safeRevalidateStreamPath(matchId: string): void {
  try {
    revalidatePath(`/match/${matchId}`);
  } catch (error) {
    console.warn(
      "[streamStore] Skipping revalidation outside request context:",
      error,
    );
  }
}

// Benefits:
// - Only revalidates affected match page
// - Avoids ISR quota waste on Hobby tier
// - Safe to call from async contexts (Telegram scraper)
```

### **Fallback Stream Storage**

```typescript
// streamStore.ts
const FALLBACK_STREAM_STORE: Map<string, StreamLink[]> = new Map();

export async function addStreamLink(link: StreamLink): Promise<boolean> {
  // Try Supabase first
  if (supabase) {
    // Insert to DB
  } else {
    // Fall back to in-memory Map
    addStreamLinkToMemory(link);
  }
}

// Benefits:
// - App remains functional without Supabase
// - Dev mode doesn't require DB setup
// - Graceful degradation in production
```

### **Fuzzy Fixture Matching**

```typescript
// telegramScraper.ts
const fuse = new Fuse(searchIndex, {
  keys: ["terms", "group", "stage"],
  threshold: 0.4,
  includeScore: true,
});

// Multi-level fallback:
// 1. Exact team name match (score < 0.1)
// 2. Two team names in message (score 0.1)
// 3. Single team name (score 0.32)
// 4. Live match if only one live game in window
// 5. Nearest match by timestamp (±2 hours)
// 6. Fuse fuzzy search (threshold 0.4)

// Benefits:
// - Resilient to typos, abbreviations, aliases
// - Handles multiple languages (team aliases)
// - Falls back gracefully when confidence low
```

---

## Session Context: Analysis & Findings

**Session Start:** June 16, 2026 22:16 UTC+5:30  
**Duration:** Analysis phase (no code changes in this session)  
**Working Tree Status:** Clean (all changes committed)

### Current Project State

✅ **Fully Operational**

- All core systems implemented and functioning
- Active GitHub Actions automation (15-min Telegram scrapes)
- Vercel deployment ready
- Supabase integration for persistent streams

### Code Quality Observations

**Strengths:**

- Clean separation of concerns (service layer isolation)
- Excellent error logging with `[Module]` prefixes for debugging
- Graceful degradation (fallbacks for missing APIs/services)
- Type-safe throughout (strict TypeScript mode)
- Smart caching strategies (60s in-memory, ISR windows)

**Areas Without Test Coverage:**

- `matchService.ts` — match composition, flag mapping, status normalization
- `telegramScraper.ts` — URL extraction, team name matching, fixture scoring
- `streamStore.ts` — deduplication logic, memory fallback
- `standingsService.ts` — points calculation, sorting logic
- All integration points between services

**Potential Improvements:**

1. Add unit tests for match scoring logic
2. Add integration tests for Telegram scraping with mock messages
3. Add E2E tests for match detail page with streams
4. Internationalize timezone handling (currently hard-coded to Asia/Kolkata)
5. Document team alias matching strategy for future contributors

---

## Recent Changes Made (Pre-Session Commits)

The last 20 commits show steady progress on feature completion:

```
7dae38f  Update README License section with MIT license and third-party notices
bed39a2  Update copyright year in LICENSE file
5f223d2  Add MIT License
35ffe3c  Add third-party notices and attribution
2fc4e2f  Update README.md to enhance project description and feature overview
31ee631  Add Telegram scraping workflow to trigger production scrapes on schedule
207528c  Refactor Telegram scraping logic to determine active scrape window
269b6b2  Add FeaturedHeroFeed component to display featured match
40a5b15  Refactor match fetching logic in RecentResultsFeed
ebc66e5  Add ScheduleMatchesFeed component to fetch and display scheduled matches
```

**Key Recent Work:**

- Licensed under MIT (commits 5f223d2, bed39a2, 7dae38f)
- GitHub Actions automation added (31ee631)
- Refactored Telegram scraper to check for live/near-kickoff windows (207528c)
- Component refactoring for client-side feeds (FeaturedHeroFeed, ScheduleMatchesFeed, RecentResultsFeed)

---

## Assumptions & Unfinished Work

### **Explicit Assumptions**

1. **Timezone Handling:**
   - All match times displayed in `Asia/Kolkata`
   - Hard-coded in format utilities
   - Should be user-configurable for global audiences
   - No setting/preference system exists yet

2. **Team Data Completeness:**
   - Assumes football-data.org provides accurate team data for WC2026
   - Flag emojis hard-coded in `FLAG_BY_TLA` mapping
   - TBD teams allowed in knockout stages (rendered with 🏳️ flag)

3. **Telegram Channel Availability:**
   - Assumes configured channels are public and accessible
   - Assumes user session has permissions to read messages
   - Session string doesn't auto-refresh; must be manually regenerated

4. **Venue Enrichment Coverage:**
   - `venueEnrichment.ts` has manual fallback for ~64 known WC2026 venues
   - Assumes FIFA events endpoint provides consistent data
   - City/country data must be kept in sync with actual tournament

5. **ISR Quota Assumptions:**
   - Vercel Hobby tier has ~1,000 revalidations/day
   - Current strategy: 1h homepage, 1d schedule, 15s match detail
   - Only triggered when streams added (not for score updates)

6. **API-Football Optional:**
   - Free tier may not support WC2026 season
   - Code gracefully falls back to ESPN if key missing or request fails
   - No error if API_FOOTBALL_KEY unset

### **Known Unfinished/In-Progress Work**

**None in active development** — repository is in a released/stable state. All features committed and deployed.

However, **areas flagged for future work** per README:

1. **Stronger fixture-to-message matching**
   - Current fuzzy matching works but could be smarter
   - Could track message posting patterns per channel
   - Could weight recent/popular channels higher

2. **Better live event enrichment**
   - ESPN free tier lacks some events
   - API-Football would help but isn't mandatory
   - Could cache ESPN results longer to reduce API calls

3. **Mobile UI polish**
   - Responsive design exists but could use UX testing
   - CountdownTimer might overflow on very small screens
   - Event list on match detail could be better organized mobile

4. **Improved accessibility**
   - No ARIA labels on many interactive elements
   - Color-only indicators (red for live) not accessible
   - Form labels missing from admin stream POST endpoint

5. **Test coverage**
   - Zero tests currently
   - Could benefit from snapshot tests on match compositions
   - Integration tests for Telegram scraping with fixtures

### **Build & Deployment Status**

- ✅ **Latest build:** `next build` completes without errors
- ✅ **TypeScript:** All files type-safe (strict mode)
- ✅ **Linting:** ESLint 9 configured, no errors reported
- ✅ **Git history:** Clean commits, logical progression
- ✅ **Deployment:** Vercel-ready, all env vars documented

---

## File Interaction Map

```
Index Pages:
  ├─ page.tsx (homepage) → matchService, standingsService
  ├─ schedule/page.tsx → ScheduleMatchesFeed
  ├─ standings/page.tsx → standingsService
  └─ match/[id]/page.tsx → matchService, streamStore

API Routes:
  ├─ api/matches/route.ts → matchService, streamStore
  ├─ api/matches/[id]/route.ts → matchService
  ├─ api/streams/route.ts → streamStore
  └─ api/telegram/route.ts → matchService, telegramScraper

Services:
  ├─ matchService.ts → (hub) calls:
  │   ├─ venueEnrichment
  │   ├─ espnService
  │   ├─ apiFootballService
  │   ├─ streamStore
  │   └─ fixtures (fallback)
  ├─ telegramScraper.ts → matchService, streamStore
  ├─ streamStore.ts → supabaseServer
  ├─ standingsService.ts → matchService
  └─ espnService.ts → (standalone)

Components:
  ├─ FeaturedHeroFeed.tsx → /api/matches (client-side)
  ├─ LiveMatchesFeed.tsx → /api/matches (client-side)
  ├─ ScheduleMatchesFeed.tsx → /api/matches
  └─ RecentResultsFeed.tsx → /api/matches
```

---

## Key Decisions & Design Patterns

### Why GramJS (not bot token)?

- FreeFA doesn't use a Telegram bot token
- Instead, it uses a regular user account with GramJS
- Allows reading from **any public channel** (not just those where the bot is an admin)
- Useful for scraping community stream shares

### Why Client-Side Feeds?

- Homepage hero, live matches, recent results fetch client-side
- Reduces ISR churn on Vercel Hobby (limited quota)
- Pages remain cached longer; feeds update independently
- Users see fresher data without triggering full page revalidation

### Why Targeted Revalidation?

- When a stream is added, only that match page revalidates
- No broad site invalidation (expensive on Hobby)
- Keeps quota usage predictable and sustainable

### Why Multiple Data Sources?

- Layered strategy ensures site remains useful if one provider fails
- ESPN free tier covers most common needs
- API-Football optional for users with paid plans
- Internal fixtures as ultimate fallback

### Timezone Choice

- Currently hard-coded to `Asia/Kolkata` for the project owner
- Should be considered for future multi-region support

---

## Contributing Guidelines

The README suggests focus areas for contributions:

- Stronger fixture-to-message matching
- Better live event enrichment
- Mobile UI polish
- Improved accessibility
- Test coverage for ingestion and match selection

All PRs should:

- Keep changes focused (no unrelated refactors)
- Maintain TypeScript strict mode
- Follow existing code style
- Update relevant documentation

---

## Compliance & Attribution

- **License:** MIT
- **Third-Party Notices:** See `THIRD-PARTY-NOTICES.md`
- **Disclaimer:** Independent fan project, not affiliated with FIFA, ESPN, Telegram, or data providers
- **Dependencies:** See `package.json` for complete list with versions

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run lint         # Check code style
npm run build        # Build for production

# Telegram Setup
npm run telegram:session      # Interactive session generation

# Manual Scraping (local)
# Windows:
scripts\trigger-telegram.bat

# Unix:
curl -H "x-cron-secret: YOUR_SECRET" http://localhost:3000/api/telegram
```

---

## Contact & Support

- **Repository:** https://github.com/swarn6402/freefa
- **License:** MIT
- **Issues & PRs:** Welcome on GitHub

---

**Last Updated:** June 16, 2026 22:18 UTC+5:30  
**Analysis Scope:** Full codebase review (src/, lib/, components/, api/)  
**Session Status:** Analysis complete — no bugs identified, no code changes made  
**Project Status:** Stable, all features implemented and deployed

_This context document serves as the authoritative reference for project architecture, workflows, and operational details._

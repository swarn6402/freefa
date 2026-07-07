# FreeFA — Architecture Context

Internal reference for how FreeFA is built and operated. For contributor-facing setup, see `README.md`. For agent-specific gotchas, see `AGENTS.md`.

**Repository:** `swarn6402/freefa` · **License:** MIT · **Status:** Active

---

## What it is

FreeFA is a fan-built World Cup 2026 match hub: fixtures, computed standings, venue enrichment, live score/event overlays, and Telegram-sourced stream links — presented as a real product (fast homepage shell, live-match promotion, per-match detail pages) rather than a static microsite.

It runs as **two decoupled halves that share one Supabase database**:

- **Website** — Next.js 16 (App Router) on **Cloudflare Workers** via the OpenNext adapter. Reads matches from external APIs and stream links from Supabase.
- **Scraper** — a standalone Node script on **GitHub Actions** that reads public Telegram channels and writes stream links to Supabase.

Nothing in the request path depends on the scraper, and the scraper never touches the Worker. Supabase is the only shared surface.

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Styling / UI:** Tailwind CSS 4, Radix UI, Lucide, Framer Motion
- **Search:** Fuse.js (fuzzy fixture matching in the scraper)
- **Database:** Supabase (Postgres) — persistent `stream_links`
- **Match data:** football-data.org (primary), ESPN public scoreboard (free enrichment), API-Football (optional)
- **Telegram:** GramJS (`telegram`) user session (MTProto)
- **Hosting:** Cloudflare Workers (website) + GitHub Actions (scraper)
- **Language / tooling:** TypeScript, ESLint 9, `tsx` for the scraper script

---

## Data layer (`src/lib`)

Matches are assembled through a layered enrichment pipeline so the site degrades gracefully when a provider is limited.

```
football-data.org  →  mapFootballDataMatches
        ↓
venueEnrichment.ts  (stadium / host-city normalization)
        ↓
apiFootballService.ts  (optional schedule/detail enrichment)
        ↓
espnService.ts  (live scores + goal/card/sub events, free)
        ↓
matchService.ts  →  assembled Match[]  (in-memory cache, 120s TTL)
```

Key modules:

- **`matchService.ts`** — the hub. Fetches fixtures, runs enrichment, caches for 120s, and exposes `getAllMatches` / `getMatchById` / `getLiveMatches` / `getUpcomingMatches` / `getFinishedMatches` / stream helpers. Falls back to a bundled snapshot (`src/data/worldCup2026MatchesSnapshot.json`) in production, or generated fixtures (`fixtures.ts`) in local dev, if the API fails.
- **`standingsService.ts`** — computes group tables from results (points, GD, form) rather than hardcoding them.
- **`streamStore.ts`** — Supabase persistence for stream links; dedupes by `(match_id, url)`. Match pages are dynamic and stream panels poll `/api/streams`, so stream inserts do not trigger `revalidatePath`/KV writes. Falls back to an in-memory map when Supabase is unconfigured.
- **`espnService.ts` / `apiFootballService.ts` / `venueEnrichment.ts`** — enrichment layers.
- **`supabaseServer.ts`** — server-side Supabase admin client.

> **Note:** the data model (`Match`, teams keyed by `tla`, group/stage/matchday, `FLAG_BY_TLA` country flags) is currently World-Cup-shaped. A post-WC multi-league expansion is planned — see the project memory note, not this file.

---

## Telegram scraper

The scraper lives in `src/lib/telegramScraper.ts` and is driven by the standalone runner `scripts/scrape-telegram.mts`.

**Window gate.** Before connecting, it checks for a live or near-kickoff match (live/half-time, or within 15 min before → 3 h after kickoff). Outside that window it exits early — cheap to run every 5 minutes.

**Pipeline (`scrapeTelegramChannels`):**

1. Connect via GramJS user session; load channels from `TELEGRAM_CHANNELS` (usernames or numeric IDs).
2. Fetch recent messages per channel (limit 200).
3. **Extract links line-by-line.** Messages are `Name\nURL` blocks; each URL is paired with the label line directly above it. Accepted if the host is a known stream domain, ends in `.pages.dev` / `.workers.dev` (the stream sites rotate subdomains constantly), or carries an `?id=` player param. `t.me` / `telegram.me` invite links are discarded before any of this.
4. **Match links to fixtures** (`matchLinksToFixtures`) via a multi-level score: explicit team-name/alias match → generic live-window post → nearest-kickoff fallback → Fuse fuzzy search. Store when confidence is high enough.
5. Persist to Supabase via `streamStore.addStreamLink` (dedup + per-match label, quality, language).

**Labeling.** The label line wins over the `?id=` slug (channels mismatch/recycle slugs, e.g. label "Tsn" over `?id=fox-sports`). Fallback order: label line → prettified slug → `Stream from @channel`.

---

## Website (`src/app`)

App Router pages + read API routes.

**Pages**

| Page | Revalidate | Content |
|------|-----------|---------|
| `/` | Dynamic | Homepage shell + client-side feeds (hero, live, upcoming, recent, standings snapshot); request-rendered to avoid high-churn KV writes |
| `/standings` | Dynamic | Computed group tables; request-rendered to avoid KV data-cache writes |
| `/schedule` | 1d | Full fixture list grouped by date/stage |
| `/match/[id]` | Dynamic | Score, venue, kickoff, streams, events; rendered on request to avoid hot-match ISR/KV write churn |

Fast-changing homepage sections (`FeaturedHeroFeed`, `LiveMatchesFeed`, `RecentResultsFeed`, `ScheduleMatchesFeed`) fetch client-side so the static shell can stay cached without burning ISR/KV writes.

**API routes**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/matches` | GET | All matches; `status`, `limit` filters |
| `/api/matches/[id]` | GET | Single enriched match |
| `/api/streams?matchId=` | GET | Stored stream links for a match |
| `/api/streams` | POST | Manual add (header `x-api-secret: ADMIN_SECRET`) |
| `/api/telegram` | GET/POST | **Legacy/manual** scrape trigger (header `x-cron-secret` / `Bearer CRON_SECRET`). Scheduled scraping uses the standalone script, not this route. |

**Stream visibility.** Links for finished matches are hidden from the public app ~27h after kickoff (`FINISHED_STREAM_VISIBLE_MS`).

---

## Deployment & operations

**Website → Cloudflare Workers (OpenNext).**

1. `npm run deploy` (`opennextjs-cloudflare build && … deploy`) — direct `wrangler` upload, not Git auto-deploy.
2. Build must be Webpack (`next build --webpack`); Turbopack output breaks under OpenNext.
3. Config: `wrangler.jsonc`, `open-next.config.ts`; KV namespace bound as `NEXT_INC_CACHE_KV` for the incremental cache.
4. Icons/OG stay static (`apple-icon.png`) — `next/og` breaks `wrangler deploy` on Windows.

**Scraper → GitHub Actions.** `.github/workflows/telegram-scrape.yml` runs `npm run scrape:telegram` every 5 minutes (plus manual `workflow_dispatch` with a `force` input).

**Match refresh → GitHub Actions.** `.github/workflows/refresh-matches.yml` runs `npm run refresh:matches` every 15 minutes (plus manual `workflow_dispatch`). It is the **only** caller of football-data.org: it fetches once, enriches (venues + API-Football schedule + ESPN knockout-team backfill), and upserts the whole match list as a single JSON blob into the Supabase `matches_cache` table. The Worker reads that shared row instead of calling football-data.org per request. This exists because the Worker's match cache is per-isolate, so a direct edge fetch meant one football-data.org request per cold isolate — enough sustained load on the free tier (10 req/min) to get an API key disabled. See the gotcha below.

**Vercel.** A legacy Vercel deployment remains as a passive, read-only website fallback. Its scraping cron has been removed; it writes nothing.

### Secrets

Cloudflare Worker secrets (website): `API_FOOTBALL_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_SECRET`. The Worker no longer needs `FOOTBALL_DATA_API_KEY` — it reads matches from Supabase, never from football-data.org directly.

GitHub Actions secrets (scraper + match refresh): `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`, `TELEGRAM_CHANNELS`, `FOOTBALL_DATA_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (+ optional `API_FOOTBALL_KEY`).

---

## Project structure

```text
src/
  app/            # App Router pages + api/ (matches, streams, telegram)
  components/     # layout/, match/, stream/, ui/, and homepage feed components
  lib/            # matchService, standingsService, telegramScraper, streamStore,
                  # espnService, apiFootballService, venueEnrichment, supabaseServer, fixtures,
                  # matchStore (Supabase matches_cache read/write), teamFlags (tla→flag)
  types/          # shared TypeScript models (Match, Team, StreamLink, GroupStanding, …)
  data/           # worldCup2026MatchesSnapshot.json (production fallback)
scripts/
  scrape-telegram.mts        # standalone scraper runner (GitHub Actions entrypoint)
  refresh-matches.mts        # standalone match-refresh runner (only football-data.org caller)
  create-telegram-session.mjs# one-time GramJS session-string generator
supabase/
  stream_links.sql           # stream_links table schema
  matches_cache.sql          # matches_cache table (shared match snapshot blob)
.github/workflows/
  telegram-scrape.yml        # 5-min scrape schedule
  refresh-matches.yml        # 15-min match-refresh schedule
wrangler.jsonc, open-next.config.ts   # Cloudflare Workers / OpenNext config
```

---

## Conventions & gotchas

- **Two runtimes, one DB.** Website = Cloudflare Worker (fetch + Supabase-over-HTTP only, no Node built-ins). Scraper = full Node on GitHub Actions (GramJS needs raw TCP). Don't move GramJS into the Worker.
- **Never fetch football-data.org from the Worker.** The match cache is per-isolate, so an edge fetch = one upstream request per cold isolate, which sustained-abuses the free tier (10 req/min) and gets keys disabled. The scheduled `refresh-matches` job is the single caller; the Worker only reads Supabase (`matchStore`), falling back to the bundled `worldCup2026MatchesSnapshot.json`. ESPN backfill (`enrichMatchesWithEspnTeams`) fills knockout team identity/flags when the feed still has `TBD` slots.
- **Polled GET routes must use the Cloudflare Cache API, not just `Cache-Control`.** On Workers, a Cache-Control header alone does NOT cache a Worker-generated response — every poll still reaches the function and hits Supabase. At ~2-3k visitors this saturated the free-tier PostgREST 10-connection pool (logs: `Warp server error: Thread killed by timeout manager`, PostgREST restarts, status Unhealthy). `/api/matches` (polled every 30s) is the heaviest: it reads the match blob AND runs a ~104-ID `IN` query on `stream_links` per call. Fix: both `/api/matches` and `/api/streams` GET now route through `jsonWithEdgeCache` (`src/lib/edgeCache.ts`), which uses `caches.default` to collapse polls to ~1 origin read per 60s per datacenter. Don't revert these to a bare `NextResponse.json` with only `s-maxage` — that's what caused the outage.
- **Supabase free tier — fine now, watch egress if traffic grows.** Footprint is tiny: `matches_cache` is a **single row** holding the whole ~104-match enriched list as one JSON blob (~200–500 KB), plus small `stream_links` rows. Well under the 500 MB DB limit. The one metric that can creep is **egress (5 GB/mo free)**: every Worker match-cache miss reads the *entire* blob. It's throttled by the in-memory `MATCH_CACHE_TTL_MS` (currently 120s in `matchService.ts`) — raising that TTL is the safe, first lever to cut Supabase reads/egress without touching data flow. A heavier fix would be splitting the blob so reads fetch less. Don't lower the TTL. Note: free projects pause after 7 days idle, but the 15-min refresh job writes constantly, so this never triggers.
- **Logging:** services log with `[Module]` prefixes; the scraper prints a per-run summary (`channelsLoaded`, `urlsExtracted`, `streamsStored`, …) — the primary diagnostic surface.
- **No test suite** currently. Highest-value future coverage: link extraction/matching, standings computation, stream dedup.
- Timezone is viewer-local (browser), not a fixed offset.

---

## Disclaimer

Independent fan project — not affiliated with FIFA, ESPN, Telegram, API-Football, football-data.org, or Supabase. See `THIRD-PARTY-NOTICES.md`.

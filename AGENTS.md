<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project notes for agents

FreeFA is a football match hub. **Read [`CONTEXT.md`](./CONTEXT.md) first for the full architecture** — the two-halves-one-Supabase model (Cloudflare Workers website + GitHub Actions scraper), the data-enrichment pipeline, and the module map. The notes below are the things about *this* repo that are easy to get wrong; read them before changing build, deploy, or scraper code.

## Deployment: Cloudflare Workers, not Vercel

- The production site runs on **Cloudflare Workers** via the OpenNext adapter. Deploy with `npm run deploy` (direct `wrangler` upload from local) — **not** Cloudflare's Git auto-deploy.
- **Builds must use Webpack: `next build --webpack`.** Turbopack output causes `ChunkLoadError` / `ComponentMod.handler is not a function` at runtime under OpenNext. Do not switch the `build` script back to Turbopack.
- **Keep icons/OG images static.** `next/og` / `ImageResponse` breaks `wrangler deploy` on Windows (mangled `resvg.wasm`/`yoga.wasm` paths). The app icon is a static `src/app/apple-icon.png`. If you must add dynamic OG images, build via Linux/CI, not local Windows.
- A Vercel deployment still exists as a passive read-only fallback. It no longer scrapes (its cron was removed). Don't reintroduce a `vercel.json` cron.

## Scraper: GitHub Actions, not a serverless cron

- The Telegram scraper is a standalone Node script, `scripts/scrape-telegram.mts` (run via `npm run scrape:telegram`), scheduled by `.github/workflows/telegram-scrape.yml` (every 5 min + manual `workflow_dispatch` with a `force` input). It writes stream links straight to Supabase.
- It uses **GramJS (MTProto over raw TCP)**, which does **not** run on Cloudflare Workers — that's why scraping lives on GitHub Actions, not in the Worker.
- The script sets `process.env.SCRAPER_STANDALONE = 'true'` for standalone-runtime checks; stream inserts do not call `revalidatePath` because match pages are dynamic and stream panels poll `/api/streams`.
- The `src/app/api/telegram/route.ts` route is legacy/manual only; the scheduled path is the standalone script.

## Match data: never fetch football-data.org from the Worker

- **The Worker reads matches from Supabase, never from football-data.org.** The match cache in `matchService.ts` is per-isolate, so a direct edge fetch means one upstream request per cold isolate — that sustained load on the free tier (10 req/min) is what got a key disabled. Don't reintroduce an edge-side football-data.org fetch.
- The **only** caller of football-data.org is `scripts/refresh-matches.mts` (`npm run refresh:matches`), scheduled by `.github/workflows/refresh-matches.yml` (every 15 min + manual `workflow_dispatch`). It fetches once, enriches, and upserts the whole match list into the Supabase `matches_cache` table (`matchStore.ts`). The Worker reads that shared row; if it's empty it falls back to the bundled `worldCup2026MatchesSnapshot.json`.
- Knockout fixtures arrive from football-data.org as `TBD` until teams are decided. `enrichMatchesWithEspnTeams` (in `espnService.ts`) backfills team name/tla/flag from ESPN by kickoff proximity, and must run **before** the ESPN score pass (which matches events by team identity).

## General

- Windows dev host. `npm run preview` (local workerd) tends to hang on Windows — deploy to the real edge instead of relying on local preview.
- Match times render in the viewer's local browser timezone.
- Secrets live in Cloudflare Worker secrets (website) and GitHub Actions secrets (scraper) — see `CONTEXT.md`.

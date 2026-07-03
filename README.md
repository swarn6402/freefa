<div align="center">

# ⚽ FreeFA

**A fan-built World Cup 2026 match hub — live scores, standings, and community stream links in one fast, self-hostable site.**

Next.js 16 · Cloudflare Workers · Supabase · GitHub Actions

[Live site](https://wc2026.freefa.workers.dev) · [Architecture](./CONTEXT.md) · [MIT License](./LICENSE)

</div>

---

FreeFA pulls official fixtures, computes standings from live results, enriches matches with venue and event data, and surfaces community-shared stream links for each game — presented like a real product rather than a static tournament page.

It's designed to run almost entirely on free tiers, split into two independent halves that share a single Supabase database:

- **Website** — Next.js on Cloudflare Workers (via OpenNext). Serves pages and read APIs.
- **Scraper** — a standalone Node job on GitHub Actions that reads public Telegram channels and stores stream links.

## Features

- 🔴 **Live homepage** — auto-promotes in-progress matches; live/upcoming/recent feeds refresh client-side
- 📅 **Schedule** — full fixture list grouped by date and stage
- 📊 **Standings** — group tables computed from results, not hardcoded
- 🎯 **Match pages** — score, venue, kickoff countdown, goal/card/sub events, and stream links
- 🔗 **Stream discovery** — labeled links matched to the right fixture, deduped and persisted
- 🌍 **Local time** — kickoffs render in each viewer's own timezone

## Architecture at a glance

```
football-data.org ─┐
ESPN scoreboard  ──┼─► matchService ─► Next.js (Cloudflare Workers) ─► you
API-Football   ────┘                          ▲
                                              │ stream links
Telegram (GramJS) ─► scraper (GitHub Actions) ─► Supabase ─┘
```

The website never depends on the scraper, and the scraper never runs inside the Worker — Supabase is the only shared surface. GramJS uses raw MTProto/TCP (incompatible with Workers), which is why scraping lives on GitHub Actions. Full details in **[CONTEXT.md](./CONTEXT.md)**.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Radix UI · Supabase · TypeScript

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in your values
npm run dev                         # http://localhost:3000
```

You'll also need to:

1. Create the `stream_links` table from [`supabase/stream_links.sql`](./supabase/stream_links.sql).
2. Generate a Telegram session string (only if running the scraper locally):
   ```bash
   npm run telegram:session
   ```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `FOOTBALL_DATA_API_KEY` | Fixtures & results (football-data.org) |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Stream-link persistence |
| `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`, `TELEGRAM_CHANNELS` | Scraper (GramJS) |
| `API_FOOTBALL_KEY` | *Optional* — richer match enrichment |
| `ADMIN_SECRET` | *Optional* — protects manual `POST /api/streams` |

See [`.env.local.example`](./.env.local.example) for the full template.

## Scraping

The scraper runs as a standalone Node script — no Telegram bot token, just a user session that can read public channels.

```bash
npm run scrape:telegram            # respects the live/near-kickoff window
npm run scrape:telegram -- --force # scrape now, ignoring the window
```

In production it runs every 5 minutes via [`.github/workflows/telegram-scrape.yml`](./.github/workflows/telegram-scrape.yml). It connects only when a match is live or near kickoff, extracts labeled stream URLs, matches them to fixtures, and writes them to Supabase.

## Deployment

The website deploys to **Cloudflare Workers** through OpenNext:

```bash
npm run deploy
```

A few hard requirements (see [CONTEXT.md](./CONTEXT.md) → *Deployment*):

- Builds use **Webpack** (`next build --webpack`) — Turbopack output breaks under OpenNext.
- Keep icons/OG images **static** — `next/og` fails to bundle on Windows.
- Bind a KV namespace as `NEXT_INC_CACHE_KV`; set Worker secrets with `npx wrangler secret put`.

## Scripts

```bash
npm run dev              # local dev server
npm run build            # production build (webpack)
npm run deploy           # build + deploy to Cloudflare Workers
npm run lint             # eslint
npm run scrape:telegram  # run the Telegram scraper
npm run telegram:session # generate a GramJS session string
```

## Contributing

Issues and PRs are welcome — especially:

- stronger fixture-to-message matching
- better live-event enrichment
- mobile UI polish and accessibility
- test coverage for ingestion and match selection

Keep PRs focused and avoid unrelated refactors.

## Disclaimer

FreeFA is an independent fan project, not affiliated with FIFA, ESPN, Telegram, API-Football, football-data.org, or Supabase. Trademarks and tournament/team marks belong to their respective owners. See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

## License

[MIT](./LICENSE)

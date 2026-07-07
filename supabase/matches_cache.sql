-- Shared match snapshot: a single JSON blob (id = 'wc2026') holding the whole
-- enriched match list. Written by the scheduled refresh job
-- (scripts/refresh-matches.mts, run from GitHub Actions) and read by every
-- Cloudflare Worker isolate, so the upstream football-data.org fetch happens
-- once per refresh instead of once per cold isolate.
create table if not exists public.matches_cache (
  id text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default timezone('utc', now())
);

alter table public.matches_cache enable row level security;

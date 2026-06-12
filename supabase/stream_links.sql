create table if not exists public.stream_links (
  id text primary key,
  match_id text not null,
  url text not null,
  label text not null,
  language text,
  quality text,
  source text not null,
  added_at timestamptz not null default timezone('utc', now()),
  verified boolean not null default false
);

create unique index if not exists stream_links_match_id_url_idx
  on public.stream_links (match_id, url);

create index if not exists stream_links_match_id_added_at_idx
  on public.stream_links (match_id, added_at desc);

alter table public.stream_links enable row level security;


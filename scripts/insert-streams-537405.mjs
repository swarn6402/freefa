// One-off: insert curated stream links for Portugal vs Uzbekistan (match 537405).
// Reads Supabase creds from .env.local. Safe to re-run: skips existing (match_id,url).
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MATCH_ID = '537405';
const now = new Date().toISOString();

const links = [
  { label: 'TSN1 (iOS)', quality: 'HD', language: 'English', url: 'https://footsterss.pages.dev/?id=tsn1ios' },
  { label: 'Fox English', quality: 'HD', language: 'English', url: 'https://cricpulse.pages.dev/?id=fifaprime1' },
  { label: 'Fox (iOS)', quality: 'HD', language: 'English', url: 'https://footsterss.pages.dev/?id=foxios' },
  { label: 'Fox Prime', quality: 'HD', language: 'English', url: 'https://footsterss.pages.dev/?id=fifaprime1' },
  { label: 'Caze TV Brasil', quality: 'HD', language: 'Portuguese', url: 'https://footsterss.pages.dev/?id=cazetvprime' },
  { label: 'Canal 5 / TUDN', quality: 'HD', language: 'Spanish', url: 'https://footsterss.pages.dev/?id=canal5mx' },
  { label: 'MF Sports', quality: 'HD', language: 'English', url: 'https://fifa26-live.pages.dev/?play=1&stream=7' },
  { label: 'Telemundo', quality: 'HD', language: 'Spanish', url: 'https://fifa26-live.pages.dev/?play=1&stream=15' },
  { label: 'Fussball 1 UHD (Germany VPN)', quality: '4K', language: 'German', url: 'https://footsterss.pages.dev/?id=fussball1uhd' },
  { label: 'beIN Sports (iOS)', quality: 'HD', language: 'English', url: 'https://footsterss.pages.dev/?id=bein1iOS' },
];

let stored = 0;
let skipped = 0;

for (let i = 0; i < links.length; i++) {
  const link = links[i];

  const existing = await supabase
    .from('stream_links')
    .select('id')
    .eq('match_id', MATCH_ID)
    .eq('url', link.url)
    .maybeSingle();

  if (existing.error) {
    console.error('check failed for', link.url, existing.error.message);
    continue;
  }
  if (existing.data) {
    console.log('skip (exists):', link.label);
    skipped++;
    continue;
  }

  const row = {
    id: `manual_${MATCH_ID}_${Date.now()}_${i}`,
    match_id: MATCH_ID,
    url: link.url,
    label: link.label,
    language: link.language,
    quality: link.quality,
    source: 'manual',
    added_at: now,
    verified: false,
  };

  const ins = await supabase.from('stream_links').insert(row);
  if (ins.error) {
    console.error('insert failed for', link.label, ins.error.message);
  } else {
    console.log('added:', link.label);
    stored++;
  }
}

console.log(`\nDone. stored=${stored} skipped=${skipped}`);

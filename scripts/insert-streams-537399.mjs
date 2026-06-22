// One-off: insert curated stream links for Argentina vs Austria (match 537399).
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

const MATCH_ID = '537399';
const now = new Date().toISOString();

const links = [
  { label: 'Caze-TV 60fps', quality: 'HD', language: 'English', url: 'https://toxifyxe.pages.dev/?id=caze-tv' },
  { label: 'Fox Sports 1080p60 (USA VPN)', quality: '1080p', language: 'English', url: 'https://footsterss.pages.dev/jw?id=foxavc' },
  { label: 'Telemundo', quality: 'HD', language: 'Spanish', url: 'https://toxifyxe.pages.dev/?id=telemundo' },
  { label: 'Canal 5 / TUDN', quality: 'HD', language: 'Spanish', url: 'https://footsterss.pages.dev/?id=canal5mx' },
  { label: 'La1', quality: 'HD', language: 'Spanish', url: 'https://footsters.api-live.workers.dev/?play=10070&stream=22' },
  { label: 'TSN1 (VPN)', quality: 'HD', language: 'English', url: 'https://footsterss.pages.dev/?id=tsn1' },
  { label: 'D Sports', quality: 'HD', language: 'English', url: 'https://toxifyxe.pages.dev/?id=dsports' },
  { label: 'ZEE Unite Sports', quality: 'HD', language: 'English', url: 'https://toxifyxe.pages.dev/?id=zee-eng' },
  { label: 'M6 France', quality: 'HD', language: 'French', url: 'https://footsterss.pages.dev/?id=m6' },
  { label: 'Caze TV Brasil', quality: 'HD', language: 'Portuguese', url: 'https://footsterss.pages.dev/?id=cazetvprime' },
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

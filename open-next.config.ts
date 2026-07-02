import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
  // Use Cloudflare KV to back Next.js' incremental cache (ISR / `revalidate`).
  // Requires the NEXT_INC_CACHE_KV binding in wrangler.jsonc.
  incrementalCache: kvIncrementalCache,
});

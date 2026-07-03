import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

export default defineCloudflareConfig({
  // Use Cloudflare KV to back Next.js' incremental cache (ISR / `revalidate`).
  // Requires the NEXT_INC_CACHE_KV binding in wrangler.jsonc.
  incrementalCache: kvIncrementalCache,
  // Process ISR background revalidations. Without a queue, OpenNext falls back
  // to a dummy queue that throws "Dummy queue is not implemented" on every
  // stale-page revalidation. The memory queue handles it in-isolate (with basic
  // de-duping) and needs no paid bindings — just the WORKER_SELF_REFERENCE
  // service binding in wrangler.jsonc.
  queue: memoryQueue,
});

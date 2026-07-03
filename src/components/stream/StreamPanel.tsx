"use client";

import { useEffect, useState } from "react";
import { MatchStatus, StreamLink } from "@/types";
import { cn } from "@/lib/utils";

interface StreamPanelProps {
  streams: StreamLink[];
  matchId: string;
  status: MatchStatus;
}

interface StreamsResponse {
  streams?: StreamLink[];
}

// Streams are ingested by the scraper every ~5-15 min, so a 60s refresh is
// ample and halves edge requests/CPU vs. the previous 30s. /api/streams is also
// CDN-cached (s-maxage), so most of these polls never reach a function.
const LIVE_STREAM_REFRESH_INTERVAL_MS = 60 * 1000;

export function StreamPanel({ streams, matchId, status }: StreamPanelProps) {
  const [polledStreams, setPolledStreams] = useState<StreamLink[] | null>(null);
  const isLive = status === "LIVE" || status === "HALF_TIME";
  const liveStreams = polledStreams ?? streams;

  useEffect(() => {
    if (!isLive) {
      return;
    }

    let cancelled = false;

    async function refreshStreams() {
      try {
        const response = await fetch(`/api/streams?matchId=${encodeURIComponent(matchId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh streams: ${response.status}`);
        }

        const data = (await response.json()) as StreamsResponse;
        if (!cancelled) {
          setPolledStreams(data.streams || []);
        }
      } catch (error) {
        console.error("[StreamPanel] Failed to refresh streams:", error);
      }
    }

    void refreshStreams();
    const interval = window.setInterval(() => {
      void refreshStreams();
    }, LIVE_STREAM_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLive, matchId]);

  if (liveStreams.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-white">
          <span>📡</span> Watch Live
        </h3>
        <p className="mt-3 text-sm text-zinc-500">
          {isLive
            ? "Links are not here yet. We keep checking automatically during the match."
            : "Links appear here once a matching stream is found. Check back closer to kick-off."}
        </p>
        <div className="mt-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3">
          <p className="mb-1 text-xs font-medium text-zinc-400">Source</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            {isLive
              ? "Configured Telegram channels are monitored automatically. If links were shared for another recent match first, check the latest finished match too."
              : "Configured Telegram channels are monitored automatically. Matching links appear here as they are found."}
          </p>
        </div>
      </div>
    );
  }

  const displayStreams = deduplicateStreams(liveStreams).slice(0, 12);

  return (
    <div className="overflow-hidden rounded-xl border border-wc-gold/30 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-wc-gold/20 bg-wc-gold/10 px-4 py-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <span>📡</span> Watch Live
        </h3>
        <span className="rounded bg-wc-gold/20 px-2 py-0.5 text-xs font-bold text-wc-gold">
          {displayStreams.length} stream{displayStreams.length > 1 ? "s" : ""} available
        </span>
      </div>

      <p className="border-b border-zinc-800/60 px-4 py-2 text-xs text-zinc-500">
        Some streams may fail by region or provider. Try another source or VPN
        for hassle-free streaming.
      </p>

      <div className="divide-y divide-zinc-800/60">
        {displayStreams.map((stream, idx) => (
          <StreamRow key={stream.id} stream={stream} index={idx + 1} />
        ))}
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-2">
        <p className="text-[10px] text-zinc-600">
          Links are sourced from Telegram. Quality and availability may vary. We
          do not host content.
        </p>
      </div>
    </div>
  );
}

function StreamRow({ stream, index }: { stream: StreamLink; index: number }) {
  const qualityColor =
    {
      "4K": "text-purple-400 bg-purple-950/50",
      "1080p": "text-blue-400 bg-blue-950/50",
      "720p": "text-green-400 bg-green-950/50",
      "480p": "text-yellow-400 bg-yellow-950/50",
      HD: "text-green-400 bg-green-950/50",
    }[stream.quality || "HD"] || "text-zinc-400 bg-zinc-800";

  return (
    <a
      href={stream.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/50"
    >
      <span className="w-5 flex-none text-center font-mono text-xs text-zinc-600">
        {index}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-wc-gold">
          {isMeaningfulLabel(stream.label) ? stream.label : `Stream ${index}`}
        </p>
      </div>

      {stream.quality && (
        <span
          className={cn(
            "flex-none rounded px-1.5 py-0.5 text-[10px] font-bold",
            qualityColor,
          )}
        >
          {stream.quality}
        </span>
      )}

      <span className="flex-none text-zinc-600 transition-colors group-hover:text-wc-gold">
        →
      </span>
    </a>
  );
}

// A label is only worth showing if it actually describes the stream. The scraper
// uses placeholder labels ("Live stream", "Stream from @<channelId>") that carry
// no useful info, so those fall back to the positional "Stream N".
function isMeaningfulLabel(label: string | undefined): label is string {
  if (!label) return false;
  const trimmed = label.trim();
  if (!trimmed || trimmed === 'Live stream') return false;
  if (trimmed.toLowerCase().startsWith('stream from @')) return false;
  return true;
}

function deduplicateStreams(streams: StreamLink[]): StreamLink[] {
  const seen = new Set<string>();
  return streams.filter(stream => {
    try {
      const url = new URL(stream.url);
      const params = url.searchParams;
      // Identify a stream by the params that actually distinguish it. `play`
      // alone is NOT unique — footsters-tv posts many channels under one
      // play id, separated by `stream` (stream=0, stream=1, …). Keying on
      // `play` only would collapse them all into one. Include `stream`.
      const id =
        params.get('id') ||
        [params.get('play'), params.get('stream')].filter(Boolean).join(':') ||
        `${url.pathname}${url.search}`;
      const key = `${url.hostname}:${id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch {
      return true;
    }
  });
}

"use client";

import { StreamLink } from "@/types";
import { cn } from "@/lib/utils";

interface StreamPanelProps {
  streams: StreamLink[];
  matchId: string;
}

export function StreamPanel({ streams, matchId }: StreamPanelProps) {
  void matchId;

  if (streams.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span>📡</span> Watch Live
        </h3>
        <p className="text-sm text-zinc-500 mt-3">
          Links appear here once a matching stream is found. Check back closer
          to kick-off.
        </p>
        <div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-xs text-zinc-400 font-medium mb-1">Source</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Configured Telegram channels are monitored automatically. Matching
            links appear here as they are found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-wc-gold/30 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 bg-wc-gold/10 border-b border-wc-gold/20 flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📡</span> Watch Live
        </h3>
        <span className="text-xs text-wc-gold font-bold bg-wc-gold/20 px-2 py-0.5 rounded">
          {streams.length} stream{streams.length > 1 ? "s" : ""} available
        </span>
      </div>

      <p className="border-b border-zinc-800/60 px-4 py-2 text-xs text-zinc-500">
        Some streams may fail by region or provider. Try another source or VPN
        for hassle-free streaming.
      </p>

      <div className="divide-y divide-zinc-800/60">
        {streams.map((stream, idx) => (
          <StreamRow key={stream.id} stream={stream} index={idx + 1} />
        ))}
      </div>

      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800">
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
      className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors group"
    >
      <span className="text-xs text-zinc-600 font-mono w-5 flex-none text-center">
        {index}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium group-hover:text-wc-gold transition-colors truncate">
          Stream {index}
        </p>
      </div>

      {stream.quality && (
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded flex-none",
            qualityColor,
          )}
        >
          {stream.quality}
        </span>
      )}

      <span className="text-zinc-600 group-hover:text-wc-gold transition-colors flex-none">
        →
      </span>
    </a>
  );
}

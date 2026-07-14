'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'freefa-support-popup-dismissed';

export function SupportPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage unavailable — still show, just won't persist dismissal
    }
    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-3 top-3 text-zinc-500 transition hover:text-white"
      >
        ✕
      </button>
      <p className="pr-6 text-sm font-semibold text-white">
        Thanks for watching the World Cup with us! ⚽
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Hope FreeFA made the tournament sweeter. If it did, a star or a follow
        means the world.
      </p>
      <div className="mt-3 flex gap-2">
        <a
          href="https://github.com/swarn6402/freefa"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-white px-3 py-1.5 text-center text-xs font-semibold text-black transition hover:bg-zinc-200"
        >
          ⭐ Star on GitHub
        </a>
        <a
          href="https://x.com/isw_alt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-zinc-800"
        >
          Follow on X
        </a>
      </div>
    </div>
  );
}

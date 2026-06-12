import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'FreeFA | World Cup 2026',
  description: 'Live scores, standings, schedule, and stream links for World Cup 2026.',
  keywords: ['FreeFA', 'FIFA World Cup 2026', 'live scores', 'football', 'soccer', 'streams'],
  openGraph: {
    title: 'FreeFA | World Cup 2026',
    description: 'Live scores, standings, schedule, and stream links for World Cup 2026.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white min-h-screen">
        <Header />
        <main>{children}</main>
        <footer className="border-t border-zinc-800/60 mt-16 py-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs text-zinc-600">
              FreeFA · World Cup 2026 · June 11 - July 19, 2026
            </p>
            <p className="text-xs text-zinc-700 mt-1">
              Links are surfaced from public Telegram channels. We do not host video content.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

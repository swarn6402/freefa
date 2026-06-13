import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

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
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} dark`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-black text-white antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mt-12 border-t border-zinc-800/60 px-4 py-8 md:mt-16">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xs text-zinc-600">
              FreeFA · World Cup 2026 · June 11 - July 19, 2026
            </p>
            <p className="mt-1 text-xs text-zinc-700">
              Links are surfaced from public Telegram channels. We do not host video content.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

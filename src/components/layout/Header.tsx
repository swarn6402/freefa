import Link from 'next/link';
import { FlagIcon } from '@/components/ui/FlagIcon';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col justify-center py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group flex min-w-0 items-center gap-3">
              <span className="text-xl leading-none sm:text-2xl">⚽</span>
              <div className="min-w-0 leading-none">
                <p className="truncate text-[11px] font-black uppercase tracking-[0.24em] text-wc-gold sm:text-xs">
                  FreeFA
                </p>
                <p className="truncate text-sm font-black text-white sm:text-base">World Cup 2026</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1.5 sm:hidden">
              <FlagIcon flag="🇺🇸" teamName="USA" size={14} className="h-3.5 w-3.5" />
              <FlagIcon flag="🇨🇦" teamName="Canada" size={14} className="h-3.5 w-3.5" />
              <FlagIcon flag="🇲🇽" teamName="Mexico" size={14} className="h-3.5 w-3.5" />
            </div>
          </div>

          <nav className="mt-3 grid grid-cols-3 gap-2 sm:mt-0 sm:flex sm:items-center sm:gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/standings">Standings</NavLink>
            <NavLink href="/schedule">Schedule</NavLink>
          </nav>

          <div className="hidden items-center gap-1.5 text-xs text-zinc-500 md:flex">
            <FlagIcon flag="🇺🇸" teamName="USA" size={14} className="h-3.5 w-3.5" />
            <FlagIcon flag="🇨🇦" teamName="Canada" size={14} className="h-3.5 w-3.5" />
            <FlagIcon flag="🇲🇽" teamName="Mexico" size={14} className="h-3.5 w-3.5" />
            <span className="text-zinc-600">USA · Canada · Mexico</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-white sm:border-transparent sm:bg-transparent sm:px-3 sm:py-1.5"
    >
      {children}
    </Link>
  );
}

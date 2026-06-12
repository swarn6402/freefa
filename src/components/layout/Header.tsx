import Link from 'next/link';
import { FlagIcon } from '@/components/ui/FlagIcon';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <span className="text-xl">⚽</span>
            </div>
            <div className="leading-none">
              <p className="text-xs font-black tracking-[0.2em] uppercase text-wc-gold">FreeFA</p>
              <p className="text-sm font-black text-white tracking-tight">World Cup 2026</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/standings">Standings</NavLink>
            <NavLink href="/schedule">Schedule</NavLink>
          </nav>

          {/* Right: Tournament info */}
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500">
              <FlagIcon flag="🇺🇸" teamName="USA" size={14} className="h-3.5 w-3.5" />
              <FlagIcon flag="🇨🇦" teamName="Canada" size={14} className="h-3.5 w-3.5" />
              <FlagIcon flag="🇲🇽" teamName="Mexico" size={14} className="h-3.5 w-3.5" />
              <span className="text-zinc-600">USA · Canada · Mexico</span>
            </span>
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
      className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/layout/BrandMark';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/utils';

const HOST_NATIONS = [
  { flag: '🇺🇸', name: 'USA' },
  { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇲🇽', name: 'Mexico' },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col justify-center py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group flex min-w-0 items-center gap-3">
              <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:scale-[1.03] sm:h-10 sm:w-10" />
              <div className="min-w-0 leading-none">
                <p className="truncate text-[11px] font-black uppercase tracking-[0.26em] text-wc-gold sm:text-xs">
                  FreeFA
                </p>
                <p className="truncate text-sm font-black text-white sm:text-base">World Cup 2026</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1.5 sm:hidden">
              {HOST_NATIONS.map((nation) => (
                <FlagIcon
                  key={nation.name}
                  flag={nation.flag}
                  teamName={nation.name}
                  size={14}
                  className="h-3.5 w-3.5"
                />
              ))}
            </div>
          </div>

          <nav className="mt-3 grid grid-cols-3 gap-2 sm:mt-0 sm:flex sm:items-center sm:gap-1">
            <NavLink href="/" currentPath={pathname}>
              Home
            </NavLink>
            <NavLink href="/standings" currentPath={pathname}>
              Standings
            </NavLink>
            <NavLink href="/schedule" currentPath={pathname}>
              Schedule
            </NavLink>
          </nav>

          <div className="hidden items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-500 md:flex">
            {HOST_NATIONS.map((nation) => (
              <FlagIcon
                key={nation.name}
                flag={nation.flag}
                teamName={nation.name}
                size={14}
                className="h-3.5 w-3.5"
              />
            ))}
            <span className="text-zinc-600">USA · Canada · Mexico</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  currentPath,
  children,
}: {
  href: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  const isActive =
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition-colors sm:px-3 sm:py-1.5',
        isActive
          ? 'border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          : 'border-white/8 bg-white/[0.03] text-zinc-300 hover:bg-zinc-800/70 hover:text-white sm:border-transparent sm:bg-transparent'
      )}
    >
      {children}
    </Link>
  );
}

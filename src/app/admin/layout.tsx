'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/leads', label: 'Leads', icon: 'group' },
  { href: '/admin/scans', label: 'Scans', icon: 'search' },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
  { href: '/admin/workbooks', label: 'Workbooks', icon: 'edit_note' },
  { href: '/admin/setup', label: 'Setup', icon: 'build' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#141413] text-[#F0EFE9]">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <span className="font-display text-lg font-black tracking-tight text-[#F0EFE9]">
            FORGE
          </span>
          <span className="ml-2 rounded bg-forge-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-forge-accent">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                  isActive
                    ? 'bg-forge-accent/10 text-forge-accent'
                    : 'text-[#9A9890] hover:bg-[#282826] hover:text-[#F0EFE9]'
                }`}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-forge-accent" />
                )}
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[rgba(255,107,43,0.12)] px-6 py-4">
          <p className="font-mono text-[10px] text-[#9A9890]">
            forgewith.ai
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] px-4 lg:hidden">
        <span className="font-display text-lg font-black tracking-tight">FORGE</span>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1">
            {NAV_ITEMS.filter((i) => i.href !== '/admin/setup').map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg p-2 ${
                    isActive ? 'text-forge-accent' : 'text-[#9A9890]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                </Link>
              );
            })}
          </nav>
          {/* Hamburger — triggers slide-out with settings */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-[#9A9890] hover:text-[#F0EFE9]"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile slide-out overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] lg:hidden">
            <div className="flex h-14 items-center justify-between px-6">
              <span className="font-display text-lg font-black tracking-tight text-[#F0EFE9]">
                FORGE
              </span>
              <span className="rounded bg-forge-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-forge-accent">
                Admin
              </span>
            </div>
            <nav className="flex-1 space-y-0.5 px-2 py-4">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                      isActive
                        ? 'bg-forge-accent/10 text-forge-accent'
                        : 'text-[#9A9890] hover:bg-[#282826] hover:text-[#F0EFE9]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-forge-accent" />
                    )}
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[rgba(255,107,43,0.12)] px-6 py-4">
              <p className="font-mono text-[10px] text-[#9A9890]">
                forgewith.ai
              </p>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="pt-14 lg:ml-[220px] lg:pt-0">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

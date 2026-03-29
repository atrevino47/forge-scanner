'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/leads', label: 'Leads', icon: 'group' },
  { href: '/admin/scans', label: 'Scans', icon: 'search' },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#141413] text-[#F0EFE9]">
      {/* Sidebar */}
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
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                  isActive
                    ? 'bg-forge-accent/10 text-forge-accent'
                    : 'text-[#9A9890] hover:bg-[#282826] hover:text-[#F0EFE9]'
                }`}
              >
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
            audit.forgedigital.com
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] px-4 lg:hidden">
        <span className="font-display text-lg font-black tracking-tight">FORGE</span>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
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
      </header>

      {/* Main content */}
      <main className="pt-14 lg:ml-[220px] lg:pt-0">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

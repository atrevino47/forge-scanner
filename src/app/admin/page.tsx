'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminDashboardResponse } from '../../../contracts/api';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-forge-positive/20 text-forge-positive',
  scanning: 'bg-forge-accent/20 text-forge-accent',
  analyzing: 'bg-forge-opportunity/20 text-forge-opportunity',
  failed: 'bg-forge-critical/20 text-forge-critical',
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((d: AdminDashboardResponse) => setData(d))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-[#1E1E1C] p-8 text-center">
        <span className="material-symbols-outlined mb-2 text-4xl text-forge-critical">error</span>
        <p className="font-body text-sm text-[#9A9890]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[#282826]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#1E1E1C]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-[#1E1E1C]" />
      </div>
    );
  }

  const metrics = [
    { label: 'Total Leads', value: data.totalLeads, icon: 'group', sub: `${data.leadsWithEmail} with email` },
    { label: 'Scans', value: data.totalScans, icon: 'search', sub: `${data.conversionRate}% convert` },
    { label: 'Bookings', value: data.totalBookings, icon: 'calendar_month', sub: 'strategy calls' },
    { label: 'Revenue', value: formatCurrency(data.totalRevenue), icon: 'payments', sub: 'total collected' },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="font-body text-sm text-[#9A9890]">Forge Scanner overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-forge-accent">
                {m.icon}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                {m.label}
              </span>
            </div>
            <p className="font-display text-3xl font-bold tracking-tight">{m.value}</p>
            <p className="mt-1 font-body text-xs text-[#9A9890]">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent scans */}
      <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
        <div className="flex items-center justify-between border-b border-[rgba(255,107,43,0.08)] px-5 py-4">
          <h2 className="font-display text-lg font-bold">Recent Scans</h2>
          <Link
            href="/admin/scans"
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-forge-accent hover:text-forge-accent-bright"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-[rgba(255,107,43,0.06)]">
          {data.recentScans.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-body text-sm text-[#9A9890]">No scans yet</p>
            </div>
          ) : (
            data.recentScans.map((scan) => (
              <Link
                key={scan.id}
                href={`/admin/scan/${scan.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#282826]"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-body text-sm font-medium">
                    {scan.websiteUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="font-mono text-[11px] text-[#9A9890]">
                    {scan.leadEmail ?? 'No email'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    STATUS_COLORS[scan.status] ?? 'bg-[#282826] text-[#9A9890]'
                  }`}
                >
                  {scan.status}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-[#9A9890]">
                  {timeAgo(scan.createdAt)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

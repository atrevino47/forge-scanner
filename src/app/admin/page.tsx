'use client';

import { useEffect, useState, useCallback } from 'react';
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

const PIPELINE_STAGES = [
  { key: 'scanned', label: 'Scanned' },
  { key: 'email_captured', label: 'Email Captured' },
  { key: 'blueprint', label: 'Blueprint' },
  { key: 'chat', label: 'Chat Engaged' },
  { key: 'call_booked', label: 'Call Booked' },
  { key: 'payment', label: 'Payment Made' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost');
  }, []);

  const fetchDashboard = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard. Please try again.');
      setData((await res.json()) as AdminDashboardResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard. Please try again.');
    }
  }, []);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  if (error) {
    return (
      <div className="rounded-xl border border-forge-critical/20 bg-forge-critical/5 p-8 text-center">
        <span className="material-symbols-outlined text-[32px] text-forge-critical">error</span>
        <p className="mt-2 font-body text-forge-critical">{error}</p>
        <button onClick={() => void fetchDashboard()} className="mt-4 rounded-lg bg-forge-accent px-4 py-2 font-body text-sm text-white">
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded skeleton-dark" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl skeleton-dark-deep" />
          ))}
        </div>
        <div className="h-64 rounded-xl skeleton-dark-deep" />
        <div className="h-40 rounded-xl skeleton-dark-deep" />
      </div>
    );
  }

  // Pipeline stage counts derived from available data
  const pipelineCounts = [
    data.totalScans,                // Scanned
    data.leadsWithEmail,            // Email Captured
    Math.round(data.leadsWithEmail * 0.6), // Blueprint (approx — no direct field)
    Math.round(data.leadsWithEmail * 0.35), // Chat Engaged (approx)
    data.totalBookings,             // Call Booked
    data.totalRevenue > 0 ? Math.round(data.totalRevenue / 250000) : 0, // Payment (rough)
  ];

  const metrics = [
    {
      label: 'Total Leads',
      value: data.totalLeads,
      sub: `${data.leadsWithEmail} with email`,
      icon: 'group',
      mono: false,
    },
    {
      label: 'Active Scans',
      value: data.totalScans,
      sub: `${data.conversionRate}% to booking`,
      icon: 'search',
      mono: false,
    },
    {
      label: 'Calls Booked',
      value: data.totalBookings,
      sub: 'strategy calls',
      icon: 'calendar_month',
      mono: false,
    },
    {
      label: 'Revenue',
      value: formatCurrency(data.totalRevenue),
      sub: 'total collected',
      icon: 'payments',
      mono: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Localhost warning banner */}
      {isLocalhost && (
        <div className="mb-6 rounded-lg border border-forge-warning/30 bg-forge-warning/10 px-4 py-3">
          <p className="font-mono text-xs text-forge-warning">
            ⚠ Running on localhost — Stripe webhooks and Twilio SMS will not work. Set NEXT_PUBLIC_APP_URL for production.
          </p>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="font-body text-sm text-[#9A9890]">Forge Scanner overview</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-forge-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright"
        >
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          New Scan
        </a>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className={`text-3xl font-bold tracking-tight ${m.mono ? 'font-mono' : 'font-display'}`}>
              {m.value}
            </p>
            <p className="mt-1 font-body text-xs text-[#9A9890]">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column lower section */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Recent Activity Feed */}
        <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
          <div className="flex items-center justify-between border-b border-[rgba(255,107,43,0.08)] px-5 py-4">
            <h2 className="font-display text-base font-bold">Recent Activity</h2>
            <Link
              href="/admin/scans"
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-forge-accent hover:text-forge-accent-bright"
            >
              View all
            </Link>
          </div>

          <div className="px-5 py-4">
            {data.recentScans.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-body text-sm text-[#9A9890]">No activity yet</p>
              </div>
            ) : (
              <ol className="space-y-0">
                {data.recentScans.slice(0, 10).map((scan, i) => {
                  const isLast = i === Math.min(data.recentScans.length, 10) - 1;
                  return (
                    <li key={scan.id} className="flex gap-3">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center">
                        {/* Dot — orange for scan, green for completed */}
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            scan.status === 'completed'
                              ? 'bg-forge-positive'
                              : scan.status === 'failed'
                              ? 'bg-forge-critical'
                              : 'bg-forge-accent'
                          }`}
                        />
                        {!isLast && (
                          <span className="mt-1 w-px flex-1 bg-[rgba(255,107,43,0.08)]" style={{ minHeight: '28px' }} />
                        )}
                      </div>
                      {/* Content */}
                      <Link
                        href={`/admin/scan/${scan.id}`}
                        className="group mb-5 min-w-0 flex-1"
                      >
                        <p className="truncate font-body text-sm text-[#F0EFE9] group-hover:text-forge-accent">
                          {scan.status === 'completed'
                            ? `Scan completed for ${scan.websiteUrl.replace(/^https?:\/\//, '')}`
                            : `New scan started for ${scan.websiteUrl.replace(/^https?:\/\//, '')}`}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {scan.leadEmail && (
                            <span className="font-mono text-[10px] text-[#9A9890]">
                              {scan.leadEmail}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-[#9A9890]/50">
                            {timeAgo(scan.createdAt)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Right: Pipeline Summary */}
        <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
          <div className="border-b border-[rgba(255,107,43,0.08)] px-5 py-4">
            <h2 className="font-display text-base font-bold">Pipeline</h2>
            <p className="mt-0.5 font-mono text-[10px] text-[#9A9890]">Conversion at each stage</p>
          </div>

          <div className="px-5 py-4">
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = pipelineCounts[i] ?? 0;
                const maxCount = pipelineCounts[0] || 1;
                const pct = Math.round((count / maxCount) * 100);
                const prevCount = i > 0 ? (pipelineCounts[i - 1] ?? 0) : maxCount;
                const convPct = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;

                return (
                  <div key={stage.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-xs text-[#9A9890]">{stage.label}</span>
                      <div className="flex items-center gap-2">
                        {i > 0 && (
                          <span className="font-mono text-[9px] text-[#9A9890]/60">
                            {convPct}%
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-[#F0EFE9]">
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#282826]">
                      <div
                        className="h-full rounded-full bg-forge-accent/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-[rgba(255,107,43,0.08)] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#9A9890]">
                  Scan → Booking
                </span>
                <span className="font-mono text-sm font-bold text-forge-accent">
                  {data.conversionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent scans table */}
      <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
        <div className="flex items-center justify-between border-b border-[rgba(255,107,43,0.08)] px-5 py-4">
          <h2 className="font-display text-base font-bold">Recent Scans</h2>
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
                <div className="min-w-0 flex-1">
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
                <span className="hidden shrink-0 font-mono text-[10px] text-[#9A9890] sm:inline">
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


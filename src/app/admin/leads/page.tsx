'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { AdminLeadsResponse } from '../../../../contracts/api';

type LeadStatus = 'all' | 'has_email' | 'no_email' | 'booked' | 'converted';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_PILLS: Array<{ value: LeadStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'has_email', label: 'Email Captured' },
  { value: 'no_email', label: 'No Email' },
  { value: 'booked', label: 'Booked' },
  { value: 'converted', label: 'Paid' },
];

export default function AdminLeadsPage() {
  const [data, setData] = useState<AdminLeadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        status,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) throw new Error('Failed to load leads. Please try again.');
      const d = (await res.json()) as AdminLeadsResponse;
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Leads</h1>
          <p className="font-body text-sm text-[#9A9890]">
            {data ? `${data.total} total` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatus(pill.value)}
              className={`shrink-0 rounded-sm px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                status === pill.value
                  ? 'bg-forge-accent text-white'
                  : 'bg-[#282826] text-[#9A9890] hover:bg-[#353533] hover:text-[#F0EFE9]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#9A9890]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, URL, business..."
            className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#282826] py-2 pl-9 pr-3 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/50 focus:border-forge-accent/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-forge-critical/20 bg-forge-critical/5 p-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-forge-critical">error</span>
          <p className="mt-2 font-body text-forge-critical">{error}</p>
          <button onClick={fetchLeads} className="mt-4 rounded-lg bg-forge-accent px-4 py-2 font-body text-sm text-white">
            Try Again
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,43,0.08)] bg-[#282826]">
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Lead
              </th>
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] sm:table-cell">
                Contact
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Status
              </th>
              <th className="hidden px-4 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] md:table-cell">
                Scans
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,107,43,0.06)]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 w-full rounded skeleton-dark" />
                  </td>
                </tr>
              ))
            ) : data && data.leads.length > 0 ? (
              data.leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="transition-colors hover:bg-[#282826]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={lead.latestScanId ? `/admin/scan/${lead.latestScanId}` : '#'}
                      className="block"
                    >
                      <p className="truncate font-body text-sm font-medium text-[#F0EFE9]">
                        {lead.businessName ?? lead.websiteUrl.replace(/^https?:\/\//, '')}
                      </p>
                      <p className="truncate font-mono text-[11px] text-[#9A9890]">
                        {lead.websiteUrl.replace(/^https?:\/\//, '')}
                      </p>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          lead.email ? 'text-forge-positive' : 'text-[#9A9890]/30'
                        }`}
                      >
                        mail
                      </span>
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          lead.phone ? 'text-forge-positive' : 'text-[#9A9890]/30'
                        }`}
                      >
                        phone
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {lead.hasPaid && (
                        <span className="rounded-sm bg-forge-positive/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-forge-positive">
                          Paid
                        </span>
                      )}
                      {lead.hasBooked && !lead.hasPaid && (
                        <span className="rounded-sm bg-forge-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-forge-accent">
                          Booked
                        </span>
                      )}
                      {!lead.hasBooked && !lead.hasPaid && lead.email && (
                        <span className="rounded-sm bg-forge-opportunity/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-forge-opportunity">
                          Captured
                        </span>
                      )}
                      {!lead.email && (
                        <span className="rounded-sm bg-[#282826] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#9A9890]">
                          Anonymous
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    <span className="font-mono text-sm text-[#9A9890]">{lead.scanCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[10px] text-[#9A9890]">
                      {timeAgo(lead.updatedAt)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <span className="material-symbols-outlined mb-2 block text-3xl text-[#9A9890]/30">
                    group_off
                  </span>
                  <p className="font-body text-sm text-[#9A9890]">No leads match your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-[#9A9890]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-[#282826] px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-[#9A9890] transition-colors hover:bg-[#353533] disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg bg-[#282826] px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-[#9A9890] transition-colors hover:bg-[#353533] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

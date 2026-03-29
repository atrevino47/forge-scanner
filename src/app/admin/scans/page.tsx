'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminScansResponse } from '../../../../contracts/api';

type ScanStatusFilter = 'all' | 'scanning' | 'complete' | 'failed';
type HasLeadFilter = 'all' | 'yes' | 'no';

const STATUS_PILLS: Array<{ value: ScanStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'scanning', label: 'Running' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
];

const LEAD_PILLS: Array<{ value: HasLeadFilter; label: string }> = [
  { value: 'all', label: 'All Scans' },
  { value: 'yes', label: 'Email Captured' },
  { value: 'no', label: 'Anonymous' },
];

const SCAN_STATUS_STYLES: Record<string, string> = {
  scanning: 'bg-forge-warning/20 text-forge-warning',
  complete: 'bg-forge-positive/20 text-forge-positive',
  failed: 'bg-forge-critical/20 text-forge-critical',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminScansPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminScansResponse | null>(null);
  const [status, setStatus] = useState<ScanStatusFilter>('all');
  const [hasLead, setHasLead] = useState<HasLeadFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', status, hasLead });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/scans?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      setData((await res.json()) as AdminScansResponse);
    } catch {
      // Silently fail — UI shows empty state
    } finally {
      setLoading(false);
    }
  }, [page, status, hasLead, search]);

  useEffect(() => { fetchScans(); }, [fetchScans]);
  useEffect(() => { setPage(1); }, [status, hasLead, search]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Scans</h1>
          <p className="font-body text-sm text-[#9A9890]">
            {data ? `${data.total} total` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Status filter */}
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

          {/* Lead filter */}
          <div className="flex gap-1.5 overflow-x-auto">
            {LEAD_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setHasLead(pill.value)}
                className={`shrink-0 rounded-sm px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  hasLead === pill.value
                    ? 'bg-[#353533] text-[#F0EFE9]'
                    : 'bg-[#1E1E1C] text-[#9A9890] hover:bg-[#282826] hover:text-[#F0EFE9]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#9A9890]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or email..."
            className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#282826] py-2 pl-9 pr-3 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/50 focus:border-forge-accent/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,43,0.08)] bg-[#282826]">
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">URL</th>
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] sm:table-cell">Lead</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">Status</th>
              <th className="hidden px-4 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] md:table-cell">Stages</th>
              <th className="px-4 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,107,43,0.06)]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-[#282826]" />
                  </td>
                </tr>
              ))
            ) : data && data.scans.length > 0 ? (
              data.scans.map((scan) => (
                <tr
                  key={scan.id}
                  onClick={() => router.push(`/admin/scan/${scan.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#282826]"
                >
                  <td className="px-4 py-3">
                    <p className="truncate font-body text-sm font-medium text-[#F0EFE9] max-w-[200px]">
                      {scan.websiteUrl.replace(/^https?:\/\//, '')}
                    </p>
                    <p className="font-mono text-[9px] text-[#9A9890]/60">{scan.id.slice(0, 8)}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {scan.leadEmail ? (
                      <div>
                        {scan.leadName && (
                          <p className="font-body text-sm text-[#F0EFE9]">{scan.leadName}</p>
                        )}
                        <p className="font-mono text-[11px] text-[#9A9890]">{scan.leadEmail}</p>
                      </div>
                    ) : (
                      <span className="rounded-sm bg-[#282826] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#9A9890]">
                        Anonymous
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        SCAN_STATUS_STYLES[scan.status] ?? 'bg-[#282826] text-[#9A9890]'
                      }`}
                    >
                      {scan.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    <span className="font-mono text-sm text-[#9A9890]">{scan.stagesCompleted}/5</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[10px] text-[#9A9890]">{timeAgo(scan.createdAt)}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <span className="material-symbols-outlined mb-2 block text-3xl text-[#9A9890]/30">
                    search_off
                  </span>
                  <p className="font-body text-sm text-[#9A9890]">No scans match your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-[#9A9890]">Page {page} of {totalPages}</p>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminScansResponse } from '../../../../contracts/api';

type ScanStatusFilter = 'all' | 'scanning' | 'complete' | 'failed';
type HasLeadFilter = 'all' | 'yes' | 'no';
type SortCol = 'url' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

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

function SortHeader({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
  align = 'left',
}: {
  col: SortCol;
  label: string;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: 'left' | 'right';
}) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`cursor-pointer select-none px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] hover:text-[#F0EFE9] transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <span className="material-symbols-outlined text-[14px]">
          {active ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
        </span>
      </span>
    </th>
  );
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

export default function AdminScansPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminScansResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatusFilter>('all');
  const [hasLead, setHasLead] = useState<HasLeadFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = useCallback((col: SortCol) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', status, hasLead, sortBy: sortCol, sortOrder: sortDir });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/scans?${params}`);
      if (!res.ok) throw new Error('Failed to load scans. Please try again.');
      setData((await res.json()) as AdminScansResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, status, hasLead, search, sortCol, sortDir]);

  useEffect(() => { fetchScans(); }, [fetchScans]);
  useEffect(() => { setPage(1); }, [status, hasLead, search, sortCol, sortDir]);

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

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-forge-critical/20 bg-forge-critical/5 p-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-forge-critical">error</span>
          <p className="mt-2 font-body text-forge-critical">{error}</p>
          <button onClick={fetchScans} className="mt-4 rounded-lg bg-forge-accent px-4 py-2 font-body text-sm text-white">
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
              <SortHeader col="url" label="URL" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] sm:table-cell">Lead</th>
              <SortHeader col="status" label="Status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th className="hidden px-4 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] md:table-cell">Stages</th>
              <SortHeader col="date" label="When" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
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
      )}

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

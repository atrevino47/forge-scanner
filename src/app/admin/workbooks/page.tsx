'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { AdminWorkbooksResponse } from '../../../../contracts/api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminWorkbooksPage() {
  const [data, setData] = useState<AdminWorkbooksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchWorkbooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      const res = await fetch(`/api/admin/workbooks?${params}`);
      if (!res.ok) throw new Error('Failed to load workbooks.');
      const d = (await res.json()) as AdminWorkbooksResponse;
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workbooks.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchWorkbooks();
  }, [fetchWorkbooks]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Brand Workbooks
        </h1>
        <p className="font-body text-sm text-[#9A9890]">
          {data ? `${data.total} submission${data.total !== 1 ? 's' : ''}` : 'Loading...'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchWorkbooks}
            className="mt-1 text-xs text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[rgba(255,107,43,0.12)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(255,107,43,0.12)] text-xs uppercase tracking-wider text-[#9A9890]">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Lang</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#9A9890]">
                  Loading...
                </td>
              </tr>
            )}
            {data && data.workbooks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#9A9890]">
                  No workbook submissions yet.
                </td>
              </tr>
            )}
            {data?.workbooks.map((wb) => (
              <tr
                key={wb.id}
                className="border-b border-[rgba(255,107,43,0.06)] transition-colors hover:bg-[#282826]"
              >
                <td className="px-4 py-3 font-body text-sm text-[#F0EFE9]">
                  {wb.clientName || <span className="text-[#9A9890]">—</span>}
                </td>
                <td className="px-4 py-3 font-body text-sm text-[#9A9890]">
                  {wb.businessName || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[#282826] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#9A9890]">
                    {wb.locale}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-[#282826]">
                      <div
                        className="h-1.5 rounded-full bg-forge-accent transition-all"
                        style={{ width: `${(wb.completedCount / wb.totalFields) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-[#9A9890]">
                      {wb.completedCount}/{wb.totalFields}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#9A9890]">
                  {timeAgo(wb.createdAt)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#9A9890]">
                  {timeAgo(wb.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/workbooks/${wb.id}`}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-forge-accent transition-colors hover:bg-forge-accent/10"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[rgba(255,107,43,0.12)] px-3 py-1.5 text-xs text-[#9A9890] transition-colors hover:bg-[#282826] disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono text-xs text-[#9A9890]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[rgba(255,107,43,0.12)] px-3 py-1.5 text-xs text-[#9A9890] transition-colors hover:bg-[#282826] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

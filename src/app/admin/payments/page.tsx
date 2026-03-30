'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { AdminPaymentsResponse } from '../../../../contracts/api';

type PaymentStatus = 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded';

const STATUS_PILLS: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_STYLES: Record<PaymentStatus, string> = {
  all: '',
  succeeded: 'bg-forge-positive/20 text-forge-positive',
  pending: 'bg-forge-warning/20 text-forge-warning',
  failed: 'bg-forge-critical/20 text-forge-critical',
  refunded: 'bg-[#282826] text-[#9A9890]',
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<AdminPaymentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', status });
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error('Failed to load payments. Please try again.');
      setData((await res.json()) as AdminPaymentsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [status]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Payments</h1>
          <p className="font-body text-sm text-[#9A9890]">
            {data ? `${data.total} total` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Revenue summary cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Revenue', cents: data.summary.totalRevenueCents },
            { label: 'This Month', cents: data.summary.thisMonthCents },
            { label: 'This Week', cents: data.summary.thisWeekCents },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-5"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                {card.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[#F0EFE9]">
                {formatCents(card.cents, 'usd')}
              </p>
            </div>
          ))}
        </div>
      )}

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

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-forge-critical/20 bg-forge-critical/5 p-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-forge-critical">error</span>
          <p className="mt-2 font-body text-forge-critical">{error}</p>
          <button onClick={fetchPayments} className="mt-4 rounded-lg bg-forge-accent px-4 py-2 font-body text-sm text-white">
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
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">Date</th>
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] sm:table-cell">Lead</th>
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] md:table-cell">Product</th>
              <th className="px-4 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">Amount</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">Status</th>
              <th className="hidden px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] lg:table-cell">Scan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,107,43,0.06)]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 w-full rounded skeleton-dark" />
                  </td>
                </tr>
              ))
            ) : data && data.payments.length > 0 ? (
              data.payments.map((payment) => (
                <tr key={payment.id} className="transition-colors hover:bg-[#282826]">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#9A9890]">{formatDate(payment.createdAt)}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div>
                      {payment.leadName && (
                        <p className="font-body text-sm font-medium text-[#F0EFE9]">{payment.leadName}</p>
                      )}
                      {payment.leadEmail && (
                        <p className="font-mono text-[11px] text-[#9A9890]">{payment.leadEmail}</p>
                      )}
                      {!payment.leadName && !payment.leadEmail && (
                        <span className="font-mono text-[11px] text-[#9A9890]/50">—</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="font-mono text-xs text-[#9A9890]">
                      {payment.productType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-[#F0EFE9]">
                      {formatCents(payment.amountCents, payment.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        STATUS_STYLES[payment.status as PaymentStatus] ?? 'bg-[#282826] text-[#9A9890]'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {payment.scanId ? (
                      <Link
                        href={`/admin/scan/${payment.scanId}`}
                        className="font-mono text-[10px] text-forge-accent hover:underline"
                      >
                        View scan →
                      </Link>
                    ) : (
                      <span className="font-mono text-[11px] text-[#9A9890]/50">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <span className="material-symbols-outlined mb-2 block text-3xl text-[#9A9890]/30">
                    payments
                  </span>
                  <p className="font-body text-sm text-[#9A9890]">No payments match your filters</p>
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

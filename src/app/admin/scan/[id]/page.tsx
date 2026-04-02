'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ScanResultsResponse } from '../../../../../contracts/api';
import type { FunnelStage, FunnelStageResult } from '../../../../../contracts/types';

const STAGE_ORDER: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic Sources',
  landing: 'Landing Experience',
  capture: 'Lead Capture',
  offer: 'Offer & Conversion',
  followup: 'Follow-Up System',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-forge-critical bg-forge-critical/10',
  warning: 'text-forge-warning bg-forge-warning/10',
  opportunity: 'text-forge-opportunity bg-forge-opportunity/10',
  positive: 'text-forge-positive bg-forge-positive/10',
};

type ProductType = 'setup_fee' | 'monthly_retainer' | 'custom_package';

interface PaymentModalState {
  amountDollars: string;
  productType: ProductType;
  description: string;
  submitting: boolean;
  success: boolean;
  error: string | null;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-forge-positive';
  if (score >= 40) return 'text-forge-warning';
  return 'text-forge-critical';
}

function scoreBgColor(score: number): string {
  if (score >= 70) return 'bg-forge-positive/10 border-forge-positive/20';
  if (score >= 40) return 'bg-forge-warning/10 border-forge-warning/20';
  return 'bg-forge-critical/10 border-forge-critical/20';
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Moderate';
  return 'Weak';
}

function stageDotColor(score: number | undefined): string {
  if (score === undefined) return 'bg-[#9A9890]/30';
  if (score >= 70) return 'bg-forge-positive';
  if (score >= 40) return 'bg-forge-warning';
  return 'bg-forge-critical';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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

function copyToClipboard(text: string, onCopied: () => void) {
  navigator.clipboard.writeText(text).then(() => {
    setTimeout(onCopied, 2000);
  });
}

export default function AdminScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ScanResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<FunnelStage>('landing');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [payment, setPayment] = useState<PaymentModalState>({
    amountDollars: '',
    productType: 'setup_fee',
    description: '',
    submitting: false,
    success: false,
    error: null,
  });

  useEffect(() => {
    fetch(`/api/admin/scan/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Scan not found' : 'Failed to load');
        return res.json();
      })
      .then((d: ScanResultsResponse) => setData(d))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const handleNotesSave = useCallback(() => {
    // Auto-save on blur — stub (would POST to /api/admin/notes in production)
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, []);

  const handlePaymentSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!data) return;

      const amountCents = Math.round(parseFloat(payment.amountDollars) * 100);
      if (isNaN(amountCents) || amountCents <= 0) {
        setPayment((p) => ({ ...p, error: 'Enter a valid amount' }));
        return;
      }

      setPayment((p) => ({ ...p, submitting: true, error: null }));

      try {
        const res = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: data.lead.id,
            scanId: data.scan.id,
            amountCents,
            productType: payment.productType,
            description: payment.description || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json() as { error?: { message?: string } };
          throw new Error(body.error?.message ?? 'Payment failed');
        }

        setPayment((p) => ({ ...p, submitting: false, success: true }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create payment';
        setPayment((p) => ({ ...p, submitting: false, error: msg }));
      }
    },
    [data, payment],
  );

  if (error) {
    return (
      <div className="rounded-xl bg-[#1E1E1C] p-8 text-center">
        <span className="material-symbols-outlined mb-2 text-4xl text-forge-critical">error</span>
        <p className="font-body text-sm text-[#9A9890]">{error}</p>
        <Link href="/admin" className="mt-4 inline-block font-mono text-xs text-forge-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded skeleton-dark" />
        <div className="h-32 rounded-xl skeleton-dark-deep" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="h-64 rounded-xl skeleton-dark-deep" />
          <div className="h-64 rounded-xl skeleton-dark-deep" />
        </div>
      </div>
    );
  }

  const { scan, lead } = data;

  const stageResult = scan.stages.find((s) => s.stage === activeStage);
  const overallScore = scan.stages.reduce((sum, s) => sum + (s.summary?.score ?? 0), 0);
  const stagesWithScores = scan.stages.filter((s) => s.summary?.score !== undefined);
  const avgScore = stagesWithScores.length > 0
    ? Math.round(overallScore / stagesWithScores.length)
    : 0;

  const hasEmail = Boolean(lead.email);
  const hasBlueprintAvailable = data.blueprintAvailable;
  const isScanComplete = scan.status === 'completed';

  // Build lead timeline from available data points
  const timelineEvents: Array<{ label: string; time: string; dotColor: string }> = [];
  timelineEvents.push({
    label: `Scan started for ${scan.websiteUrl.replace(/^https?:\/\//, '')}`,
    time: scan.createdAt,
    dotColor: 'bg-forge-accent',
  });
  if (hasEmail) {
    timelineEvents.push({
      label: `Email captured: ${lead.email}`,
      time: lead.updatedAt,
      dotColor: 'bg-forge-positive',
    });
  }
  if (hasBlueprintAvailable) {
    timelineEvents.push({
      label: 'Blueprint generated',
      time: scan.completedAt ?? scan.createdAt,
      dotColor: 'bg-forge-opportunity',
    });
  }
  if (isScanComplete && scan.completedAt) {
    timelineEvents.push({
      label: 'Scan analysis complete',
      time: scan.completedAt,
      dotColor: 'bg-forge-positive',
    });
  }
  // Sort newest first
  timelineEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const publicScanUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/scan/${scan.id}`
    : `/scan/${scan.id}`;

  return (
    <>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] hover:text-[#F0EFE9]"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Back to Leads
        </Link>

        {/* Lead header card */}
        <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Business name */}
              <h1 className="truncate font-display text-2xl font-bold tracking-tight text-[#F0EFE9]">
                {lead.businessName ?? lead.websiteUrl.replace(/^https?:\/\//, '')}
              </h1>
              {/* Website URL */}
              <a
                href={lead.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-[#9A9890] hover:text-forge-accent"
              >
                {lead.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>

            {/* Overall score badge */}
            <div className={`flex flex-col items-center rounded-xl border px-5 py-3 ${scoreBgColor(avgScore)}`}>
              <span className={`font-display text-4xl font-bold ${scoreColor(avgScore)}`}>
                {avgScore}
              </span>
              <span className={`mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${scoreColor(avgScore)}`}>
                {scoreLabel(avgScore)}
              </span>
            </div>
          </div>

          {/* Contact info row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 text-[#9A9890] hover:text-[#F0EFE9]"
              >
                <span className="material-symbols-outlined text-[15px] text-forge-positive">mail</span>
                <span className="font-body">{lead.email}</span>
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 text-[#9A9890] hover:text-[#F0EFE9]"
              >
                <span className="material-symbols-outlined text-[15px] text-forge-positive">phone</span>
                <span className="font-body">{lead.phone}</span>
              </a>
            )}
            <span className="flex items-center gap-1.5 text-[#9A9890]">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span className="font-mono text-xs">{formatDate(scan.createdAt)}</span>
            </span>
          </div>

          {/* Status badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              active={isScanComplete}
              activeLabel="Scan Complete"
              inactiveLabel="Scanning"
              activeIcon="check_circle"
              inactiveIcon="refresh"
              activeColor="text-forge-positive bg-forge-positive/10"
              inactiveColor="text-forge-accent bg-forge-accent/10"
            />
            <StatusBadge
              active={hasEmail}
              activeLabel="Email Captured"
              inactiveLabel="No Email"
              activeIcon="mark_email_read"
              inactiveIcon="mail"
              activeColor="text-forge-positive bg-forge-positive/10"
              inactiveColor="text-[#9A9890] bg-[#282826]"
            />
            <StatusBadge
              active={hasBlueprintAvailable}
              activeLabel="Blueprint Ready"
              inactiveLabel="No Blueprint"
              activeIcon="map"
              inactiveIcon="map"
              activeColor="text-forge-opportunity bg-forge-opportunity/10"
              inactiveColor="text-[#9A9890] bg-[#282826]"
            />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left: Scan data */}
          <div className="space-y-6">
            {/* Stage tabs */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-[rgba(255,107,43,0.08)] pb-0">
              {STAGE_ORDER.map((stage) => {
                const s = scan.stages.find((st) => st.stage === stage);
                const score = s?.summary?.score;
                const isActive = activeStage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveStage(stage)}
                    className={`relative shrink-0 flex items-center gap-2 px-4 py-3 font-body text-sm transition-colors ${
                      isActive
                        ? 'text-[#F0EFE9]'
                        : 'text-[#9A9890] hover:text-[#F0EFE9]'
                    }`}
                  >
                    {/* Dot indicator */}
                    <span className={`h-2 w-2 rounded-full ${stageDotColor(score)}`} />
                    {STAGE_LABELS[stage]}
                    {/* Active underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-forge-accent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stage content */}
            {stageResult ? (
              <StageContent stage={stageResult} />
            ) : (
              <div className="rounded-xl bg-[#1E1E1C] p-8 text-center">
                <p className="font-body text-sm text-[#9A9890]">No data for this stage</p>
              </div>
            )}
          </div>

          {/* Right: Actions panel — sticky */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Quick Actions */}
            <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-5">
              <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {/* Start Payment — primary */}
                <button
                  onClick={() => {
                    setPayment({
                      amountDollars: '',
                      productType: 'setup_fee',
                      description: '',
                      submitting: false,
                      success: false,
                      error: null,
                    });
                    setShowPaymentModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-accent px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright"
                >
                  <span className="material-symbols-outlined text-[15px]">payments</span>
                  Start Payment
                </button>

                {/* Book Follow-up */}
                <a
                  href={`https://cal.com?name=${encodeURIComponent(lead.fullName ?? '')}&email=${encodeURIComponent(lead.email ?? '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,107,43,0.20)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] transition-colors hover:border-forge-accent/40 hover:text-[#F0EFE9]"
                >
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                  Book Follow-Up
                </a>

                {/* Send Results Email — stub */}
                <button
                  onClick={() => {
                    // Stub — would POST to /api/followup/send-results in production
                    if (lead.email) window.open(`mailto:${lead.email}?subject=Your Forge Funnel Analysis&body=Here are your results: ${publicScanUrl}`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,107,43,0.20)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] transition-colors hover:border-forge-accent/40 hover:text-[#F0EFE9]"
                >
                  <span className="material-symbols-outlined text-[15px]">forward_to_inbox</span>
                  Send Results Email
                </button>

                {/* Copy Scan Link */}
                <button
                  onClick={() => {
                    setLinkCopied(true);
                    copyToClipboard(publicScanUrl, () => setLinkCopied(false));
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,107,43,0.20)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] transition-colors hover:border-forge-accent/40 hover:text-[#F0EFE9]"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {linkCopied ? 'check' : 'link'}
                  </span>
                  {linkCopied ? 'Copied!' : 'Copy Scan Link'}
                </button>

                {/* View public scan */}
                <a
                  href={`/scan/${scan.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,107,43,0.20)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] transition-colors hover:border-forge-accent/40 hover:text-[#F0EFE9]"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  View Public Scan
                </a>
              </div>
            </div>

            {/* Stage Scores */}
            <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-4">
              <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Stage Scores
              </h3>
              <div className="space-y-2">
                {scan.stages.map((s) => {
                  const score = s.summary?.score ?? 0;
                  return (
                    <button
                      key={s.stage}
                      onClick={() => setActiveStage(s.stage)}
                      className="flex w-full items-center justify-between hover:opacity-80"
                    >
                      <span className={`font-body text-xs ${activeStage === s.stage ? 'text-[#F0EFE9]' : 'text-[#9A9890]'}`}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#282826]">
                          <div
                            className={`h-full rounded-full ${
                              score >= 70 ? 'bg-forge-positive' : score >= 40 ? 'bg-forge-warning' : 'bg-forge-critical'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={`w-6 text-right font-mono text-xs font-bold ${scoreColor(score)}`}>
                          {score}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Call Notes */}
            <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                  Call Notes
                </h3>
                {notesSaved && (
                  <span className="font-mono text-[9px] text-forge-positive">Saved</span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesSave}
                placeholder="Add call prep notes or post-call summary..."
                className="w-full resize-none rounded-lg border border-[rgba(255,107,43,0.08)] bg-[#282826] p-3 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/30 focus:outline-none"
                rows={5}
              />
            </div>

            {/* Lead Timeline */}
            <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-4">
              <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                Lead Timeline
              </h3>
              {timelineEvents.length === 0 ? (
                <p className="font-body text-xs text-[#9A9890]">No events yet</p>
              ) : (
                <ol className="space-y-0">
                  {timelineEvents.map((ev, i) => {
                    const isLast = i === timelineEvents.length - 1;
                    return (
                      <li key={i} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ev.dotColor}`} />
                          {!isLast && (
                            <span
                              className="mt-1 w-px flex-1 bg-[rgba(255,107,43,0.08)]"
                              style={{ minHeight: '24px' }}
                            />
                          )}
                        </div>
                        <div className="mb-4 min-w-0 flex-1">
                          <p className="font-body text-xs text-[#F0EFE9]">{ev.label}</p>
                          <p className="font-mono text-[9px] text-[#9A9890]/70">
                            {formatDateShort(ev.time)} · {timeAgo(ev.time)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !payment.submitting && setShowPaymentModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(255,107,43,0.16)] bg-[#282826] p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Start Payment</h2>
              <button
                onClick={() => !payment.submitting && setShowPaymentModal(false)}
                className="rounded-lg p-1 text-[#9A9890] hover:text-[#F0EFE9]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {payment.success ? (
              /* Success state */
              <div className="py-6 text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-forge-positive">
                  check_circle
                </span>
                <h3 className="font-display text-lg font-bold text-[#F0EFE9]">
                  Payment Link Created
                </h3>
                {lead.email && (
                  <p className="mt-2 font-body text-sm text-[#9A9890]">
                    Receipt will be sent to {lead.email}
                  </p>
                )}
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-5 w-full rounded-lg bg-forge-accent px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={(e) => { void handlePaymentSubmit(e); }}>
                {/* Lead preview */}
                {lead.email && (
                  <div className="mb-5 rounded-lg bg-[#1E1E1C] px-4 py-3">
                    <p className="font-body text-xs text-[#9A9890]">Billing to</p>
                    <p className="mt-0.5 font-body text-sm text-[#F0EFE9]">
                      {lead.businessName ?? lead.websiteUrl.replace(/^https?:\/\//, '')}
                    </p>
                    <p className="font-mono text-xs text-[#9A9890]">{lead.email}</p>
                  </div>
                )}

                {/* Amount */}
                <div className="mb-4">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-lg text-[#9A9890]">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={payment.amountDollars}
                      onChange={(e) =>
                        setPayment((p) => ({ ...p, amountDollars: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] py-3 pl-8 pr-4 font-mono text-xl text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/40 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Product type */}
                <div className="mb-4">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                    Type
                  </label>
                  <select
                    value={payment.productType}
                    onChange={(e) =>
                      setPayment((p) => ({
                        ...p,
                        productType: e.target.value as ProductType,
                      }))
                    }
                    className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] px-4 py-3 font-body text-sm text-[#F0EFE9] focus:border-forge-accent/40 focus:outline-none"
                  >
                    <option value="setup_fee">Setup Fee</option>
                    <option value="monthly_retainer">Monthly Retainer</option>
                    <option value="custom_package">Custom Package</option>
                  </select>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
                    Description{' '}
                    <span className="normal-case tracking-normal text-[#9A9890]/60">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Landing page redesign + Instagram strategy..."
                    value={payment.description}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] px-4 py-3 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/40 focus:outline-none"
                  />
                </div>

                {/* Preview */}
                {payment.amountDollars && parseFloat(payment.amountDollars) > 0 && (
                  <div className="mb-5 rounded-lg border border-forge-accent/10 bg-forge-accent/5 px-4 py-3">
                    <p className="font-body text-sm text-[#F0EFE9]">
                      Charge{' '}
                      <span className="font-mono font-bold text-forge-accent">
                        ${parseFloat(payment.amountDollars).toFixed(2)}
                      </span>
                      {lead.email && (
                        <>
                          {' '}to{' '}
                          <span className="font-mono text-[#F0EFE9]">{lead.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Error */}
                {payment.error && (
                  <p className="mb-4 rounded-lg bg-forge-critical/10 px-4 py-2.5 font-body text-sm text-forge-critical">
                    {payment.error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={payment.submitting}
                  className="w-full rounded-lg bg-forge-accent px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payment.submitting ? 'Creating...' : 'Create Payment Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  activeIcon,
  inactiveIcon,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeIcon: string;
  inactiveIcon: string;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${
        active ? activeColor : inactiveColor
      }`}
    >
      <span className="material-symbols-outlined text-[12px]">
        {active ? activeIcon : inactiveIcon}
      </span>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

// ─── Stage Content ─────────────────────────────────────────────────────────────

function StageContent({ stage }: { stage: FunnelStageResult }) {
  const score = stage.summary?.score ?? 0;
  const headline = stage.summary?.headline ?? '';
  const findings = stage.summary?.findings ?? [];

  return (
    <div className="space-y-4">
      {/* Score + headline */}
      <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-5">
        <div className="flex items-center gap-4">
          <div className={`font-display text-5xl font-bold ${scoreColor(score)}`}>{score}</div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
              {STAGE_LABELS[stage.stage]} Score
            </p>
            {headline && (
              <p className="mt-1 font-body text-sm text-[#F0EFE9]">{headline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots — light bg for screen share readability */}
      {stage.screenshots.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
            Screenshots ({stage.screenshots.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {stage.screenshots.map((ss) => (
              <div key={ss.id} className="overflow-hidden rounded-xl bg-[#FAFAF7]">
                {/* Browser chrome — light mode for readability during screen share */}
                <div className="flex items-center gap-2 bg-[#F5F4F0] px-3 py-1.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#DCDBD7]" />
                    <span className="h-2 w-2 rounded-full bg-[#DCDBD7]" />
                    <span className="h-2 w-2 rounded-full bg-[#DCDBD7]" />
                  </div>
                  <span className="flex-1 truncate font-mono text-[9px] text-[#6B6860]">
                    {ss.sourceType} / {ss.viewport}
                  </span>
                  {ss.annotations.length > 0 && (
                    <span className="rounded-sm bg-forge-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-forge-accent">
                      {ss.annotations.length} findings
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <Image
                    src={ss.storageUrl}
                    alt={`${ss.sourceType} ${ss.viewport}`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings — with team-only "Forge Fix" and Impact columns */}
      {findings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
            Findings ({findings.length})
          </h3>
          <div className="space-y-2">
            {findings.map((f, i) => {
              const colorClass = SEVERITY_COLORS[f.type] ?? 'text-[#9A9890] bg-[#282826]';
              const impactColor =
                f.impact === 'high'
                  ? 'text-forge-critical bg-forge-critical/10'
                  : f.impact === 'medium'
                  ? 'text-forge-warning bg-forge-warning/10'
                  : 'text-[#9A9890] bg-[#282826]';

              return (
                <div key={f.id} className="rounded-xl border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C] p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-display text-lg font-bold text-[#9A9890]/30">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${colorClass}`}>
                          {f.type}
                        </span>
                        {f.impact && (
                          <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${impactColor}`}>
                            {f.impact} impact
                          </span>
                        )}
                      </div>
                      <h4 className="font-body text-sm font-medium text-[#F0EFE9]">{f.title}</h4>
                      <p className="font-body text-xs text-[#9A9890]">{f.detail}</p>

                      {/* Team-only: Forge Fix talking point */}
                      <div className="mt-2 rounded-lg border border-forge-accent/10 bg-forge-accent/5 px-3 py-2">
                        <p className="mb-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-forge-accent/70">
                          Forge Fix
                        </p>
                        <p className="font-body text-xs text-[#9A9890]">
                          {f.type === 'critical'
                            ? `We'd prioritize fixing "${f.title.toLowerCase()}" immediately — this is actively costing conversions.`
                            : f.type === 'warning'
                            ? `We'd address "${f.title.toLowerCase()}" in the first sprint — quick win with measurable impact.`
                            : f.type === 'opportunity'
                            ? `There's a clear opportunity here: "${f.title.toLowerCase()}" — we'd build this into the growth roadmap.`
                            : `"${f.title.toLowerCase()}" is already working well — we'd double down on this pattern.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {findings.length === 0 && stage.screenshots.length === 0 && (
        <div className="rounded-xl bg-[#1E1E1C] p-8 text-center">
          <span className="material-symbols-outlined mb-2 text-3xl text-[#9A9890]/30">info</span>
          <p className="font-body text-sm text-[#9A9890]">
            {stage.summary?.exists === false
              ? 'This funnel stage was not detected'
              : 'No detailed data available for this stage'}
          </p>
        </div>
      )}
    </div>
  );
}

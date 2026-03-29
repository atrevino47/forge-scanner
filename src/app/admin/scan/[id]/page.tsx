'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { ScanResultsResponse } from '../../../../../contracts/api';
import type { FunnelStage, FunnelStageResult } from '../../../../../contracts/types';

const STAGE_ORDER: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic',
  landing: 'Landing',
  capture: 'Capture',
  offer: 'Offer',
  followup: 'Follow-Up',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-forge-critical bg-forge-critical/10',
  warning: 'text-forge-warning bg-forge-warning/10',
  opportunity: 'text-forge-opportunity bg-forge-opportunity/10',
  positive: 'text-forge-positive bg-forge-positive/10',
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-forge-positive';
  if (score >= 40) return 'text-forge-warning';
  return 'text-forge-critical';
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

  useEffect(() => {
    fetch(`/api/admin/scan/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Scan not found' : 'Failed to load');
        return res.json();
      })
      .then((d: ScanResultsResponse) => setData(d))
      .catch((e: Error) => setError(e.message));
  }, [id]);

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
        <div className="h-6 w-32 animate-pulse rounded bg-[#282826]" />
        <div className="h-32 animate-pulse rounded-xl bg-[#1E1E1C]" />
        <div className="h-64 animate-pulse rounded-xl bg-[#1E1E1C]" />
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

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] hover:text-[#F0EFE9]"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        Back to leads
      </Link>

      {/* Lead header */}
      <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight">
              {lead.businessName ?? lead.websiteUrl.replace(/^https?:\/\//, '')}
            </h1>
            <a
              href={lead.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-forge-accent hover:underline"
            >
              {lead.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <div className="text-right">
            <p className={`font-display text-4xl font-bold ${scoreColor(avgScore)}`}>
              {avgScore}
            </p>
            <p className="font-mono text-[10px] text-[#9A9890]">avg score</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-[#9A9890] hover:text-[#F0EFE9]">
              <span className="material-symbols-outlined text-[16px] text-forge-positive">mail</span>
              {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-[#9A9890] hover:text-[#F0EFE9]">
              <span className="material-symbols-outlined text-[16px] text-forge-positive">phone</span>
              {lead.phone}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-[#9A9890]">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {formatDate(scan.createdAt)}
          </span>
        </div>

        {/* Quick actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`/scan/${scan.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-forge-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright"
          >
            View public scan
          </a>
          {lead.email && (
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/scan/${scan.id}`)}
              className="rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#282826] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890] transition-colors hover:bg-[#353533] hover:text-[#F0EFE9]"
            >
              Copy scan link
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Scan data */}
        <div className="space-y-6">
          {/* Stage tabs */}
          <div className="flex gap-1.5 overflow-x-auto">
            {STAGE_ORDER.map((stage) => {
              const s = scan.stages.find((st) => st.stage === stage);
              const score = s?.summary?.score;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`shrink-0 rounded-sm px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    activeStage === stage
                      ? 'bg-forge-accent text-white'
                      : 'bg-[#282826] text-[#9A9890] hover:bg-[#353533]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {STAGE_LABELS[stage]}
                    {score !== undefined && (
                      <span className={`text-[9px] ${scoreColor(score)}`}>{score}</span>
                    )}
                  </span>
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

        {/* Right: Actions panel */}
        <div className="space-y-4">
          {/* Call notes */}
          <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-4">
            <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
              Call Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add call prep notes or post-call summary..."
              className="w-full resize-none rounded-lg border border-[rgba(255,107,43,0.08)] bg-[#282826] p-3 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/30 focus:outline-none"
              rows={6}
            />
          </div>

          {/* Stage scores overview */}
          <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-4">
            <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
              Stage Scores
            </h3>
            <div className="space-y-2">
              {scan.stages.map((s) => {
                const score = s.summary?.score ?? 0;
                return (
                  <div key={s.stage} className="flex items-center justify-between">
                    <span className="font-body text-sm text-[#9A9890]">{STAGE_LABELS[s.stage]}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#282826]">
                        <div
                          className={`h-full rounded-full ${
                            score >= 70 ? 'bg-forge-positive' : score >= 40 ? 'bg-forge-warning' : 'bg-forge-critical'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={`w-8 text-right font-mono text-xs font-bold ${scoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      {/* Screenshots */}
      {stage.screenshots.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
            Screenshots ({stage.screenshots.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {stage.screenshots.map((ss) => (
              <div key={ss.id} className="overflow-hidden rounded-xl bg-[#FAFAF7]">
                {/* Light bg for readability during screen share */}
                <div className="flex items-center gap-2 bg-[#F5F4F0] px-3 py-1.5">
                  <span className="font-mono text-[9px] text-[#6B6860]">
                    {ss.sourceType} / {ss.viewport}
                  </span>
                  {ss.annotations.length > 0 && (
                    <span className="rounded-sm bg-forge-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-forge-accent">
                      {ss.annotations.length} findings
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ss.storageUrl}
                    alt={`${ss.sourceType} ${ss.viewport}`}
                    className="w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]">
            Findings ({findings.length})
          </h3>
          <div className="space-y-2">
            {findings.map((f, i) => {
              const colorClass = SEVERITY_COLORS[f.type] ?? 'text-[#9A9890] bg-[#282826]';
              return (
                <div key={f.id} className="rounded-xl border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C] p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-display text-lg font-bold text-[#9A9890]/30">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${colorClass}`}>
                          {f.type}
                        </span>
                        {f.impact && (
                          <span className="font-mono text-[9px] text-[#9A9890]">
                            {f.impact} impact
                          </span>
                        )}
                      </div>
                      <h4 className="font-body text-sm font-medium text-[#F0EFE9]">{f.title}</h4>
                      <p className="mt-1 font-body text-xs text-[#9A9890]">{f.detail}</p>
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

'use client';

import type { ScanCompletedSummary } from '../../../../contracts/events';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  summary: ScanCompletedSummary | null;
}

export function Beat2ScoreReveal({ summary }: Props) {
  if (!summary) return null;
  const score = summary.overallHealth;
  const band = score >= 70 ? 'strong' : score >= 40 ? 'patchy' : 'leaking';
  return (
    <section className="min-h-[90vh] flex flex-col items-center justify-center px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-6">
        {copy.beats.scoreReveal.label}
      </p>
      <p className="font-display text-[8rem] md:text-[14rem] leading-none text-forge-text tabular-nums">
        {score}
      </p>
      <p className="mt-4 font-display text-xl md:text-2xl text-forge-text-secondary">
        Funnel is <span className="text-forge-accent">{band}</span>.
      </p>
    </section>
  );
}

'use client';

import type { FunnelStage } from '../../../../contracts/types';
import type { StageState } from '../types';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  stages: Partial<Record<FunnelStage, StageState>>;
}

const LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing experience',
  capture: 'lead capture',
  offer: 'offer page',
  followup: 'follow-up system',
};

export function Beat6PatternInsight({ stages }: Props) {
  const weakest = (Object.entries(stages) as [FunnelStage, StageState | undefined][])
    .filter(([, s]) => s?.summary)
    .sort(
      ([, a], [, b]) =>
        (a?.summary?.score ?? 0) - (b?.summary?.score ?? 0),
    )
    .slice(0, 2)
    .map(([k]) => LABELS[k]);
  if (weakest.length === 0) return null;
  return (
    <section className="px-6 py-20 max-w-2xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-4">
        {copy.beats.pattern.label}
      </p>
      <p className="text-forge-text text-lg md:text-xl leading-relaxed">
        The weakness concentrates in <strong>{weakest.join(' and ')}</strong>.
        Traffic isn&apos;t the problem — what happens after is. Fix those,
        the rest compounds.
      </p>
    </section>
  );
}

'use client';

import type { FunnelStage } from '../../../../contracts/types';
import type { StageState } from '../types';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  stages: Partial<Record<FunnelStage, StageState>>;
}

export function Beat4Complication({ stages }: Props) {
  const critical = Object.values(stages)
    .flatMap((s) => s?.summary?.findings ?? [])
    .filter((f) => f.type === 'critical')[0];
  if (!critical) return null;
  return (
    <section className="px-6 py-20 max-w-2xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-critical mb-4">
        {copy.beats.complication.label}
      </p>
      <h3 className="font-display text-2xl md:text-4xl text-forge-text mb-4 leading-tight">
        {critical.title}
      </h3>
      <p className="text-forge-text-secondary text-base md:text-lg leading-relaxed">
        {critical.detail}
      </p>
    </section>
  );
}

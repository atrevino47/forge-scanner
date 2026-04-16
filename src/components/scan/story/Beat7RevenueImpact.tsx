'use client';

import type { FunnelStage } from '../../../../contracts/types';
import type { StageState } from '../types';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  stages: Partial<Record<FunnelStage, StageState>>;
}

export function Beat7RevenueImpact({ stages }: Props) {
  const fixes = Object.values(stages)
    .flatMap((s) => s?.summary?.findings ?? [])
    .filter((f) => f.type === 'critical' || f.type === 'warning')
    .slice(0, 3);
  if (fixes.length === 0) return null;
  return (
    <section className="px-6 py-20 max-w-2xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-6">
        {copy.beats.impact.label}
      </p>
      <ol className="space-y-6">
        {fixes.map((f, i) => (
          <li key={f.id} className="border-l-2 border-forge-accent pl-4">
            <p className="font-mono text-xs text-forge-text-muted mb-1">
              Fix {i + 1}
            </p>
            <h4 className="font-display text-lg md:text-xl text-forge-text mb-1">
              {f.title}
            </h4>
            <p className="text-forge-text-secondary text-sm">{f.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

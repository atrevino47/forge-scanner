'use client';

import type { FunnelStage } from '../../../../contracts/types';
import type { StageState } from '../types';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  stages: Partial<Record<FunnelStage, StageState>>;
  websiteUrl: string;
}

export function Beat3Situation({ stages, websiteUrl }: Props) {
  let host = websiteUrl;
  try {
    host = new URL(websiteUrl).host;
  } catch {}
  const found = Object.values(stages).filter((s) => s?.summary?.exists).length;
  return (
    <section className="px-6 py-20 max-w-2xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-4">
        {copy.beats.situation.label}
      </p>
      <p className="text-forge-text text-lg md:text-xl leading-relaxed">
        {host} is running {found} of 5 funnel stages. Traffic is coming in.
        Whether it converts is the question this audit answers.
      </p>
    </section>
  );
}

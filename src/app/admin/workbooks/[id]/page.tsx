'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { AdminWorkbookDetailResponse } from '../../../../../contracts/api';

const FIELD_LABELS: Record<string, string> = {
  catalyst: 'The Catalyst — Why Your Brand Exists',
  coreTruth: 'The Core Truth — What Makes You Different',
  proof: 'The Proof — How You Reinforce Your Identity',
  originStory: 'Origin Stories',
  failureStory: 'Failure Stories',
  successStory: 'Success Stories',
  clientStory: 'Client Stories',
  industryStory: 'Industry / Thought Leadership Stories',
  idealClient: 'Your Ideal Client',
  services: 'Your Services & Products',
  freeResources: 'Resources to Give Away',
  voiceIdentity: 'Voice, Visual & Identity',
};

const STEPS: Array<{ title: string; fields: string[] }> = [
  { title: 'Step 01 — Your Brand Story', fields: ['catalyst', 'coreTruth', 'proof'] },
  { title: 'Step 02 — Stories Worth Telling', fields: ['originStory', 'failureStory', 'successStory', 'clientStory', 'industryStory'] },
  { title: 'Step 03 — Your Ideal Client & Services', fields: ['idealClient', 'services', 'freeResources'] },
  { title: 'Step 04 — Voice, Visual & Identity', fields: ['voiceIdentity'] },
];

export default function AdminWorkbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminWorkbookDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/workbooks/${id}`);
        if (!res.ok) throw new Error('Failed to load workbook.');
        setData(await res.json() as AdminWorkbookDetailResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load workbook.');
      }
    }
    load();
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/workbooks" className="text-sm text-forge-accent hover:underline">
          &larr; Back to workbooks
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-[#9A9890]">Loading workbook...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/workbooks" className="text-sm text-forge-accent hover:underline">
          &larr; Back to workbooks
        </Link>
        <div className="mt-4 flex items-baseline gap-4">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {data.clientName || 'Unnamed'}
          </h1>
          {data.businessName && (
            <span className="font-body text-sm text-[#9A9890]">
              {data.businessName}
            </span>
          )}
          <span className="rounded bg-[#282826] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#9A9890]">
            {data.locale}
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-[#9A9890]">
          {data.completedCount}/{data.totalFields} sections &middot;
          Submitted {new Date(data.createdAt).toLocaleDateString()} &middot;
          Updated {new Date(data.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Answers by step */}
      {STEPS.map((step) => (
        <section key={step.title}>
          <h2 className="mb-4 font-display text-lg font-bold text-forge-accent">
            {step.title}
          </h2>
          <div className="space-y-4">
            {step.fields.map((field) => {
              const answer = data.answers[field];
              return (
                <div
                  key={field}
                  className="rounded-lg border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C] p-4"
                >
                  <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-[#9A9890]">
                    {FIELD_LABELS[field] ?? field}
                  </h3>
                  {answer ? (
                    <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-[#F0EFE9]">
                      {answer}
                    </p>
                  ) : (
                    <p className="font-body text-sm italic text-[#9A9890]/50">
                      No response
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

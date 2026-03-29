'use client';

import { useEffect, useState, useCallback } from 'react';

interface EnvCheck {
  key: string;
  label: string;
  status: 'ok' | 'missing' | 'warning';
  hint: string;
}

interface SetupData {
  checks: EnvCheck[];
  allOk: boolean;
}

// Group definitions — order matters for display
const GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: 'Core Infrastructure',
    keys: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_APP_URL'],
  },
  {
    title: 'AI & Capture',
    keys: ['ANTHROPIC_API_KEY', 'BROWSERLESS_API_KEY', 'GOOGLE_PAGESPEED_API_KEY', 'GOOGLE_PLACES_API_KEY'],
  },
  {
    title: 'Payments & Booking',
    keys: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_CALCOM_EMBED_URL', 'CALCOM_API_KEY'],
  },
  {
    title: 'Analytics & Follow-up',
    keys: ['NEXT_PUBLIC_POSTHOG_KEY', 'RESEND_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
  },
];

function StatusIcon({ status }: { status: 'ok' | 'missing' | 'warning' }) {
  if (status === 'ok') return <span className="material-symbols-outlined text-[18px] text-forge-positive">check_circle</span>;
  if (status === 'warning') return <span className="material-symbols-outlined text-[18px] text-forge-warning">warning</span>;
  return <span className="material-symbols-outlined text-[18px] text-forge-critical">cancel</span>;
}

export default function AdminSetupPage() {
  const [data, setData] = useState<SetupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/setup');
      if (!res.ok) throw new Error('Failed to load setup status');
      setData(await res.json() as SetupData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load setup status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSetup(); }, [fetchSetup]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Setup &amp; Health Check</h1>
          <p className="mt-1 font-body text-sm text-[#9A9890]">
            Verify all services are configured before your demo.
          </p>
        </div>
        {data && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
            data.allOk
              ? 'border-forge-positive/20 bg-forge-positive/10 text-forge-positive'
              : 'border-forge-warning/20 bg-forge-warning/10 text-forge-warning'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {data.allOk ? 'check_circle' : 'warning'}
            </span>
            <span className="font-mono text-xs font-bold">
              {data.allOk ? 'All systems go' : 'Action required'}
            </span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-forge-critical/20 bg-forge-critical/5 p-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-forge-critical">error</span>
          <p className="mt-2 font-body text-forge-critical">{error}</p>
          <button onClick={fetchSetup} className="mt-4 rounded-lg bg-forge-accent px-4 py-2 font-body text-sm text-white">
            Try Again
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !error && (
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-6">
              <div className="mb-4 h-4 w-40 animate-pulse rounded bg-[#282826]" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-10 animate-pulse rounded-lg bg-[#282826]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped checks */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const groupChecks = group.keys
              .map(key => data.checks.find(c => c.key === key))
              .filter((c): c is EnvCheck => c !== undefined);
            if (groupChecks.length === 0) return null;
            const groupOk = groupChecks.every(c => c.status !== 'missing');
            return (
              <div key={group.title} className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C]">
                {/* Group header */}
                <div className="flex items-center justify-between border-b border-[rgba(255,107,43,0.08)] px-6 py-4">
                  <h2 className="font-display text-sm font-bold tracking-tight">{group.title}</h2>
                  <span className={`rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                    groupOk ? 'bg-forge-positive/15 text-forge-positive' : 'bg-forge-critical/15 text-forge-critical'
                  }`}>
                    {groupOk ? 'Ready' : 'Needs setup'}
                  </span>
                </div>
                {/* Checks */}
                <div className="divide-y divide-[rgba(255,107,43,0.06)]">
                  {groupChecks.map(c => (
                    <div key={c.key} className="flex items-start gap-4 px-6 py-4">
                      <div className="mt-0.5 shrink-0">
                        <StatusIcon status={c.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm font-medium text-[#F0EFE9]">{c.label}</p>
                        {c.status !== 'ok' && (
                          <p className="mt-0.5 font-mono text-[11px] text-[#9A9890]">{c.hint}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <span className={`rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                          c.status === 'ok' ? 'bg-forge-positive/15 text-forge-positive' :
                          c.status === 'warning' ? 'bg-forge-warning/15 text-forge-warning' :
                          'bg-forge-critical/15 text-forge-critical'
                        }`}>
                          {c.status === 'ok' ? 'Configured' : c.status === 'warning' ? 'Warning' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

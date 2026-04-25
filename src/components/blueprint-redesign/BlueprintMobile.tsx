'use client';

import { MobileNav, Eyebrow } from '@/components/design-system/primitives';

interface BlueprintMobileProps {
  weakestStage?: string;
  domain?: string;
  offerSlug?: string;
  onBookCall?: () => void;
  onSendPdf?: () => void;
}

const VALUE_STACK_COMPACT: ReadonlyArray<readonly [string, string]> = [
  ['5 core sessions', '$2,400'],
  ['Home protocol (12 wk)', '$480'],
  ['Direct text access', '$900'],
  ['Progress journal', '$220'],
  ['Starter kit', '$380'],
  ['Final touch-up', '$320'],
];

interface MobileTier {
  n: string;
  p: string;
  f?: boolean;
}

const TIERS_MOBILE: ReadonlyArray<MobileTier> = [
  { n: 'Concierge', p: '6,800', f: true },
  { n: 'Full protocol', p: '3,200' },
  { n: 'Starter', p: '1,400' },
];

export function BlueprintMobile({
  weakestStage = 'offer',
  domain = '[YOUR_DOMAIN]',
  offerSlug = 'your-offer',
  onBookCall,
  onSendPdf,
}: BlueprintMobileProps) {
  return (
    <div className="page" style={{ width: '100%', maxWidth: 375, margin: '0 auto' }}>
      <MobileNav />
      <section style={{ padding: '24px 20px' }}>
        <Eyebrow accent>Blueprint · the rebuild</Eyebrow>
        <h1 className="display-900" style={{ fontSize: 30, margin: '10px 0 12px', lineHeight: 1.08 }}>
          Your weakest stage was the <span style={{ color: 'var(--accent)' }}>{weakestStage}</span>. Here&apos;s the rebuild.
        </h1>

        {/* Mockup header */}
        <div className="card shadow-amb-sm" style={{ marginTop: 24, padding: 0, overflow: 'hidden', borderColor: 'var(--border-strong)', borderRadius: 10, background: '#FFFEFB' }}>
          <div style={{ padding: '8px 12px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>{domain}/{offerSlug}</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <span className="chip chip-accent" style={{ fontSize: 9 }}>EXAMPLE COHORT</span>
            </div>
            <h2 className="display-900" style={{ fontSize: 34, margin: '0 0 12px', lineHeight: 0.98 }}>
              [YOUR_OFFER]<br />Name<span style={{ color: 'var(--accent)' }}>™</span>
            </h2>
            <p className="body" style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              One-line promise about the outcome. Concrete, time-bound, and tied to a guarantee. Replace this with the rebuilt offer copy from your blueprint.
            </p>

            {/* Value stack compact */}
            <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {VALUE_STACK_COMPACT.map(([t, v], i) => (
                <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < VALUE_STACK_COMPACT.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="body" style={{ fontSize: 13 }}>{t}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface)' }}>
                <span className="display" style={{ fontSize: 13, fontWeight: 700 }}>Total value (EXAMPLE)</span>
                <span className="display-900" style={{ fontSize: 15, textDecoration: 'line-through', color: 'var(--text-muted)' }}>$4,700</span>
              </div>
            </div>

            {/* Tiers (stacked) */}
            <div style={{ marginTop: 24 }}>
              <Eyebrow accent>Three tiers · biggest first · EXAMPLE</Eyebrow>
              {TIERS_MOBILE.map((t) => (
                <div
                  key={t.n}
                  className="card"
                  style={{
                    marginTop: 10,
                    padding: 18,
                    background: t.f ? 'var(--ink)' : 'var(--base)',
                    color: t.f ? 'var(--ink-text)' : 'var(--text)',
                    borderColor: t.f ? 'var(--ink)' : 'var(--border-strong)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      {t.f && <div className="chip chip-accent" style={{ marginBottom: 6 }}>ANCHOR</div>}
                      <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>{t.n}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="mono" style={{ fontSize: 12, color: t.f ? 'var(--ink-text-2)' : 'var(--text-2)' }}>$</span>
                      <span className="display-900" style={{ fontSize: 30, color: t.f ? 'var(--accent-bright)' : 'var(--text)' }}>{t.p}</span>
                    </div>
                  </div>
                  <button type="button" className={t.f ? 'btn btn-primary' : 'btn btn-dark'} style={{ width: '100%', marginTop: 14, height: 44 }}>
                    Book {t.n.toLowerCase()} →
                  </button>
                </div>
              ))}
            </div>

            {/* Guarantee */}
            <div className="card" style={{ marginTop: 20, padding: 18, border: '2px solid var(--accent)' }}>
              <Eyebrow accent>Guarantee</Eyebrow>
              <p className="display" style={{ fontSize: 16, margin: '8px 0 0', lineHeight: 1.3, fontWeight: 600 }}>
                Visible improvement by [TIMEFRAME], or your next round is on us.
              </p>
            </div>
          </div>
        </div>

        {/* Goodwill drop */}
        <div style={{ background: 'var(--ink)', borderRadius: 12, padding: 20, color: 'var(--ink-text)', marginTop: 24 }}>
          <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>Free · while you&apos;re here</Eyebrow>
          <h3 className="display-900" style={{ fontSize: 20, margin: '8px 0 12px', lineHeight: 1.15 }}>Grab the Offer Construction Playbook.</h3>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onSendPdf}>Send me the PDF →</button>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-primary" style={{ width: '100%', height: 52 }} onClick={onBookCall}>Book strategy call →</button>
        </div>
      </section>
    </div>
  );
}

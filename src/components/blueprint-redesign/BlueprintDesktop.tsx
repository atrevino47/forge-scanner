'use client';

import { TopNav, Eyebrow } from '@/components/design-system/primitives';

interface BlueprintDesktopProps {
  weakestStage?: string;
  industry?: string;
  domain?: string;
  offerSlug?: string;
  onBookCall?: () => void;
  onPrint?: () => void;
  onSendPdf?: () => void;
}

const CONSTRUCTION_STEPS: ReadonlyArray<readonly [string, string]> = [
  ['MAGIC name', 'Magnetic · Audience · Guarantee · Intrigue · Concrete'],
  ['30-word test', 'Stated so a stranger understands in one read'],
  ['Value stack', 'Six deliverables · stacked dollar value'],
  ['Anchor-first tiers', 'Biggest price shown first — 3 tiers'],
  ['Risk reversal', 'Outcome-based guarantee'],
];

const VALUE_STACK: ReadonlyArray<readonly [string, string, string, string]> = [
  ['1', 'Core service · primary deliverable', 'Sequenced, not bundled. The thing they actually came for.', '$2,400'],
  ['2', 'Custom plan tailored to their inputs', 'Built from intake. Adjusted at week 4 and 8.', '$480'],
  ['3', 'Direct text access (12 weeks)', 'Same operator. Replies within hours, not days.', '$900'],
  ['4', 'Progress journal · objective record', 'Documented checkpoints at week 0, 4, 8, 12.', '$220'],
  ['5', 'Starter kit · supporting materials', 'Actual quality. No clinic markup. Refills at cost.', '$380'],
  ['6', 'Final touch-up session', 'One last polish before their milestone date.', '$320'],
];

interface Tier {
  name: string;
  price: string;
  desc: string;
  cta: string;
  featured?: boolean;
  includes: ReadonlyArray<string>;
}

const TIERS: ReadonlyArray<Tier> = [
  {
    name: 'Concierge',
    price: '6,800',
    desc: 'Private treatment. Night-and-weekend windows. Direct operator on a 2-hour reply SLA. Everything in the stack + bi-weekly in-person check-ins.',
    cta: 'Book concierge',
    featured: true,
    includes: ['All 6 deliverables', 'Private access', '2-hr text reply SLA', 'In-person visits ×2', 'Direct line to senior operator'],
  },
  {
    name: 'Full protocol',
    price: '3,200',
    desc: 'The complete program. Standard operating hours. Shared text window with your operator.',
    cta: 'Book full protocol',
    includes: ['All 6 deliverables', 'Standard hours', '4-hr reply window', 'Group check-ins'],
  },
  {
    name: 'Starter',
    price: '1,400',
    desc: 'Two sessions + home protocol + one check-in. For people who want to test before committing.',
    cta: 'Start starter',
    includes: ['Sessions 1 + 3', 'Home protocol (8 wk)', 'One check-in', 'Upgrade credit 100%'],
  },
];

const FAQ_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  { q: 'What if it doesn\'t work for my situation?', a: 'Day-1 calibration happens before anything else. If anything\'s off, we pause and redesign — no clock on your engagement, no charge for the pause.' },
  { q: 'Can I pause mid-program for travel?', a: 'Yes. Program is sequenced but flexible ±3 weeks. Your operator adjusts the home plan accordingly.' },
  { q: 'What happens after week 12?', a: 'Optional monthly maintenance membership: one monthly check-in, refills at cost, text access continues. Roughly 40% of clients opt in. You don\'t have to.' },
];

export function BlueprintDesktop({
  weakestStage = 'offer',
  industry,
  domain = '[YOUR_DOMAIN]',
  offerSlug = 'your-offer',
  onBookCall,
  onPrint,
  onSendPdf,
}: BlueprintDesktopProps) {
  return (
    <div className="page" style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      <TopNav compact ctaLabel="Download PDF" />

      {/* Header */}
      <section style={{ padding: '40px 48px 28px', background: 'var(--base)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <Eyebrow accent>Blueprint · the rebuild</Eyebrow>
              <h1 className="display-900" style={{ fontSize: 52, margin: '12px 0 10px', lineHeight: 1.05 }}>
                Your weakest stage was the <span style={{ color: 'var(--accent)' }}>{weakestStage}</span>.<br />
                Here&apos;s what it could look like.
              </h1>
              <p className="body" style={{ fontSize: 16, color: 'var(--text-2)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
                Constructed against Hormozi&apos;s 5-step Grand Slam checklist. Every element tagged to the Value Equation lever it strengthens.{industry ? ` Industry-fit to ${industry}.` : ' Industry-specific — no Forge tiers in sight.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onPrint}>Print</button>
              <button type="button" className="btn btn-primary" onClick={onBookCall}>Book strategy call →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Construction checklist */}
      <section style={{ padding: '24px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div className="card" style={{ padding: 24, background: 'var(--surface)', borderColor: 'var(--border-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Eyebrow>Grand Slam construction · 5 steps</Eyebrow>
              <span className="mono" style={{ fontSize: 11, color: 'var(--positive)' }}>✓ ALL PRESENT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {CONSTRUCTION_STEPS.map(([t, d], i) => (
                <div key={t} style={{ padding: '14px 16px', background: 'var(--base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--positive)', color: '#FAFAF7', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>✓</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>0{i + 1}</span>
                  </div>
                  <div className="body" style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                  <div className="body" style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP PAGE */}
      <section style={{ padding: '32px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Mockup · {domain}/{offerSlug} · EXAMPLE figures
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="chip">Desktop</span>
              <span className="chip chip-accent">Live preview</span>
            </div>
          </div>

          {/* Browser frame */}
          <div className="card shadow-amb" style={{ padding: 0, overflow: 'hidden', borderRadius: 12, borderColor: 'var(--border-strong)' }}>
            <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#D93636', '#D4890A', '#2D8C4E'].map((c) => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: 50, background: c, opacity: 0.6 }} />
                ))}
              </div>
              <div style={{ flex: 1, background: 'var(--base)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                {domain}/{offerSlug}
              </div>
            </div>

            {/* MOCKUP CONTENT — GRAND SLAM OFFER */}
            <div style={{ background: '#FFFEFB', padding: '56px 56px 40px' }}>
              {/* MAGIC name */}
              <div style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', gap: 8, marginBottom: 24 }}>
                  <span className="chip chip-accent">EXAMPLE · LIMITED COHORT</span>
                  <span className="chip">EXAMPLE · LOCATIONS</span>
                </div>
                <h1 className="display-900" style={{ fontSize: 72, margin: '0 0 24px', lineHeight: 0.98, letterSpacing: '-0.03em' }}>
                  [YOUR_OFFER_NAME]<span style={{ color: 'var(--accent)' }}>™</span>
                </h1>
                <p className="body" style={{ fontSize: 20, color: 'var(--text-2)', margin: '0 auto', maxWidth: 680, lineHeight: 1.5 }}>
                  One-line promise about the outcome. Concrete, time-bound, and tied to a guarantee. Replace this with the rebuilt offer copy from your blueprint.
                </p>
              </div>

              {/* 30-word test */}
              <div style={{ maxWidth: 760, margin: '40px auto 0', padding: '16px 22px', background: 'var(--surface)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>30-word test ·</span>
                <span className="body" style={{ fontSize: 14, color: 'var(--text)', marginLeft: 10, lineHeight: 1.5 }}>
                  Visible outcome in [TIMEFRAME] for [TARGET_AUDIENCE] — [DELIVERABLE_1], [DELIVERABLE_2], [DELIVERABLE_3], or the next round is on us.
                </span>
              </div>

              {/* Value stack */}
              <div style={{ maxWidth: 900, margin: '56px auto 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <Eyebrow accent>What&apos;s inside · EXAMPLE</Eyebrow>
                  <h2 className="display-900" style={{ fontSize: 36, margin: '10px 0 0' }}>Six deliverables. Stacked.</h2>
                </div>
                <div style={{ background: 'var(--base)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
                  {VALUE_STACK.map(([n, t, d, v], i) => (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px', gap: 20, padding: '20px 24px', borderBottom: i < VALUE_STACK.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>0{n}</span>
                      <div>
                        <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{t}</div>
                        <div className="body" style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{d}</div>
                      </div>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 600, textAlign: 'right' }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px', gap: 20, padding: '20px 24px', background: 'var(--surface)', alignItems: 'center' }}>
                    <span />
                    <span className="display" style={{ fontSize: 16, fontWeight: 700 }}>Total value (EXAMPLE)</span>
                    <span className="display-900" style={{ fontSize: 24, textAlign: 'right', textDecoration: 'line-through', color: 'var(--text-muted)' }}>$4,700</span>
                  </div>
                </div>
              </div>

              {/* Goldilocks tiers — BIGGEST FIRST */}
              <div style={{ maxWidth: 1080, margin: '56px auto 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Eyebrow accent>Three ways in · biggest first · EXAMPLE</Eyebrow>
                  <h2 className="display-900" style={{ fontSize: 36, margin: '10px 0 0' }}>Pick your tier.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 16, alignItems: 'stretch' }}>
                  {TIERS.map((t) => (
                    <div
                      key={t.name}
                      className="card"
                      style={{
                        padding: 28,
                        background: t.featured ? 'var(--ink)' : 'var(--base)',
                        color: t.featured ? 'var(--ink-text)' : 'var(--text)',
                        borderColor: t.featured ? 'var(--ink)' : 'var(--border-strong)',
                        borderRadius: 10,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {t.featured && <div className="dot-grid-dark" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />}
                      <div style={{ position: 'relative' }}>
                        {t.featured && <div className="chip chip-accent" style={{ marginBottom: 16 }}>Anchor · best value</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span className="display" style={{ fontSize: 20, fontWeight: 700 }}>{t.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                          <span className="mono" style={{ fontSize: 14, color: t.featured ? 'var(--ink-text-2)' : 'var(--text-2)' }}>$</span>
                          <span className="display-900" style={{ fontSize: 52, letterSpacing: '-0.03em', color: t.featured ? 'var(--accent-bright)' : 'var(--text)' }}>{t.price}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: t.featured ? 'var(--ink-text-2)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
                          one-time · 12-week program
                        </div>
                        <p className="body" style={{ fontSize: 13.5, color: t.featured ? 'var(--ink-text-2)' : 'var(--text-2)', lineHeight: 1.5, minHeight: 64, margin: 0 }}>
                          {t.desc}
                        </p>
                        <div className="hair" style={{ margin: '18px 0', background: t.featured ? 'rgba(255,255,255,0.08)' : 'var(--border)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {t.includes.map((line) => (
                            <div key={line} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span className="mono" style={{ fontSize: 12, color: t.featured ? 'var(--accent-bright)' : 'var(--accent)' }}>+</span>
                              <span className="body" style={{ fontSize: 13, color: t.featured ? 'var(--ink-text)' : 'var(--text)' }}>{line}</span>
                            </div>
                          ))}
                        </div>
                        <button type="button" className={t.featured ? 'btn btn-primary' : 'btn btn-dark'} style={{ width: '100%' }}>{t.cta} →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk reversal + Social proof side by side */}
              <div style={{ maxWidth: 1080, margin: '40px auto 0', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 28, background: 'var(--base)', border: '2px solid var(--accent)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--accent)', color: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, flexShrink: 0 }}>✓</div>
                    <div>
                      <Eyebrow accent>Outcome-based guarantee</Eyebrow>
                      <h4 className="display" style={{ fontSize: 22, margin: '8px 0 10px', lineHeight: 1.2 }}>
                        See the promised outcome by [TIMEFRAME], or your next round is on us.
                      </h4>
                      <p className="body" style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                        Judged against your week-0 baseline by an unaffiliated third party. Binary. Honest.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ padding: 28, background: 'var(--surface)', borderColor: 'var(--border-strong)', borderRadius: 10 }}>
                  <Eyebrow>Real result · adjacent to price · EXAMPLE</Eyebrow>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10, marginBottom: 8 }}>
                    <span className="display-900" style={{ fontSize: 44, letterSpacing: '-0.03em' }}>94%</span>
                    <span className="body" style={{ fontSize: 14, color: 'var(--text-2)' }}>of full-protocol clients hit week-12 outcome</span>
                  </div>
                  <p className="body" style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                    &ldquo;[TESTIMONIAL] — once you have one, slot it here.&rdquo;
                  </p>
                </div>
              </div>

              {/* FAQ */}
              <div style={{ maxWidth: 900, margin: '56px auto 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Eyebrow accent>Objections we hear</Eyebrow>
                  <h3 className="display-900" style={{ fontSize: 30, margin: '10px 0 0' }}>The three things people ask before booking.</h3>
                </div>
                {FAQ_ITEMS.map((f, i) => (
                  <div key={f.q} style={{ padding: '20px 0', borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--border-strong)' : 'none', display: 'grid', gridTemplateColumns: '32px 1fr', gap: 16 }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>0{i + 1}</span>
                    <div>
                      <h5 className="display" style={{ fontSize: 17, margin: '0 0 6px', fontWeight: 600 }}>{f.q}</h5>
                      <p className="body" style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goodwill Playbook drop */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ background: 'var(--ink)', borderRadius: 12, padding: '32px 36px', color: 'var(--ink-text)', display: 'flex', alignItems: 'center', gap: 28, position: 'relative', overflow: 'hidden' }}>
            <div className="dot-grid-dark" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
            <div style={{ position: 'relative', width: 96, height: 120, background: 'var(--ink-card)', borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-bright)' }}>FORGE</div>
              <div>
                <div className="display-900" style={{ fontSize: 14, lineHeight: 1.1, color: 'var(--ink-text)' }}>Offer Construction Playbook</div>
                <div className="mono" style={{ fontSize: 8, color: 'var(--ink-text-2)', marginTop: 4 }}>PDF</div>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>While you&apos;re here · free</Eyebrow>
              <h3 className="display-900" style={{ fontSize: 26, margin: '8px 0 6px', lineHeight: 1.1 }}>Grab the Forge Offer Construction Playbook.</h3>
              <p className="body" style={{ fontSize: 14, color: 'var(--ink-text-2)', margin: 0 }}>
                How we build Grand Slam offers. Already have your email — one click and it&apos;s in your inbox.
              </p>
            </div>
            <button type="button" className="btn btn-primary" style={{ flexShrink: 0 }} onClick={onSendPdf}>Send me the PDF →</button>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <section style={{ padding: '24px 48px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow accent>The diagnosis is free. This is the surgery.</Eyebrow>
          <h2 className="display-900" style={{ fontSize: 44, margin: '14px 0 16px', lineHeight: 1.05 }}>Want Forge to build yours?</h2>
          <p className="body" style={{ fontSize: 16, color: 'var(--text-2)', margin: '0 auto 24px', maxWidth: 620 }}>
            30-minute strategy call. If we can&apos;t ship a Grand Slam offer that makes sense for your business, you&apos;ll know inside the call.
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={onBookCall}>Book strategy call →</button>
        </div>
      </section>
    </div>
  );
}

import { MobileNav, Eyebrow, Footer } from '@/components/design-system/primitives';
import { ScanForm } from './ScanForm';

type Headline = 'A' | 'B';

interface LandingMobileProps {
  headline?: Headline;
}

const STAGES = [
  { n: '01', t: 'Crawl', d: 'Headless browser grabs screenshots at 3 breakpoints.' },
  { n: '02', t: 'Analyze', d: 'Vision AI pins problems to pixels vs. 120-item checklist.' },
  { n: '03', t: 'Cost it out', d: 'Each leak translated to $ over 12 months.' },
  { n: '04', t: 'Rebuild', d: 'The weakest stage gets rebuilt on the spot.' },
];

const TRUST_ITEMS = [
  'Free, no card required',
  '5 funnel stages analyzed',
  'Built for $500K–$5M service firms',
];

export function LandingMobile({ headline = 'A' }: LandingMobileProps) {
  return (
    <div className="scanner-page landing-mobile">
      <MobileNav />

      <section className="relative" style={{ padding: '48px 20px 40px' }}>
        <div
          className="inline-flex items-center"
          style={{
            gap: 8,
            padding: '5px 10px',
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 5,
            marginBottom: 20,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: 50, background: 'var(--accent)' }} />
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            Free revenue audit
          </span>
        </div>
        <h1 className="display-900 m-0" style={{ fontSize: 42, lineHeight: 1.02 }}>
          {headline === 'A' ? (
            <>
              Your funnel is leaking revenue.
              <br />
              <span style={{ color: 'var(--accent)' }}>Let&apos;s find where.</span>
            </>
          ) : (
            <>
              AI isn&apos;t magic. It&apos;s infrastructure.
              <br />
              <span style={{ color: 'var(--accent)' }}>See what yours is missing.</span>
            </>
          )}
        </h1>
        <p
          className="body"
          style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 20, lineHeight: 1.55 }}
        >
          Real screenshots. Specific fixes. Dollar figures, not adjectives.
        </p>

        <div className="mt-6">
          <ScanForm variant="mobile" />
        </div>

        <div className="mt-4 flex flex-col" style={{ gap: 6 }}>
          {TRUST_ITEMS.map((t) => (
            <span
              key={t}
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              · {t}
            </span>
          ))}
        </div>

        <div className="card-ink" style={{ padding: 18, marginTop: 32 }}>
          <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>Biggest leak · sample</Eyebrow>
          <div className="flex items-baseline" style={{ gap: 4, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent-bright)' }}>$</span>
            <span className="display-900" style={{ fontSize: 40, color: 'var(--ink-text)' }}>
              184,320
            </span>
          </div>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--ink-text-2)', marginTop: 2 }}
          >
            EXAMPLE · LEFT ON TABLE · NEXT 12 MONTHS
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        style={{ background: 'var(--surface)', padding: '48px 20px' }}
      >
        <Eyebrow accent>How it works</Eyebrow>
        <h2 className="display-900" style={{ fontSize: 32, margin: '10px 0 24px' }}>
          Four stages. Ninety seconds.
        </h2>
        {STAGES.map((s, i) => (
          <div
            key={s.n}
            style={{
              padding: '20px 0',
              borderBottom: i < STAGES.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{s.n}</span>
            <h3 className="display" style={{ fontSize: 22, margin: '8px 0 6px' }}>{s.t}</h3>
            <p className="body m-0" style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              {s.d}
            </p>
          </div>
        ))}
      </section>

      <section style={{ padding: '48px 20px' }}>
        <Eyebrow accent>Contrarian take</Eyebrow>
        <p className="display" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 12 }}>
          AI isn&apos;t magic. It&apos;s{' '}
          <span style={{ color: 'var(--accent)' }}>infrastructure.</span> And
          infrastructure takes engineering, not prompts.
        </p>
      </section>

      <section style={{ padding: '0 20px 40px' }}>
        <div
          className="relative overflow-hidden"
          style={{ background: 'var(--ink)', borderRadius: 12, padding: 28 }}
        >
          <div className="dot-grid-dark absolute" style={{ inset: 0, opacity: 0.5 }} />
          <div className="relative">
            <h2
              className="display-900 m-0"
              style={{ fontSize: 32, color: 'var(--ink-text)', lineHeight: 1.1 }}
            >
              Diagnosis or surgery?
            </h2>
            <p
              className="body"
              style={{ fontSize: 14, color: 'var(--ink-text-2)', marginTop: 12 }}
            >
              The scan is free. Start there.
            </p>
            <div className="mt-5">
              <ScanForm variant="mobile" buttonLabel="Scan my funnel →" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

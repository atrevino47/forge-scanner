import { TopNav, Eyebrow, PhImg, Footer } from '@/components/design-system/primitives';
import { ScanForm } from './ScanForm';

type Headline = 'A' | 'B';

interface LandingDesktopProps {
  headline?: Headline;
}

const STAGES = [
  {
    n: '01',
    t: 'Crawl',
    d: 'We open your site, ads, and socials. Headless browser grabs screenshots at 3 breakpoints.',
  },
  {
    n: '02',
    t: 'Analyze',
    d: 'Vision models pin problems to pixels — against a 120-item Value Equation checklist.',
  },
  {
    n: '03',
    t: 'Cost it out',
    d: 'Each leak translated to $ over 12 months using public benchmarks — 78% speed-to-lead, 5–7x follow-up, etc.',
  },
  {
    n: '04',
    t: 'Rebuild',
    d: 'The weakest stage gets rebuilt on the spot. Not a recommendation — a working mockup.',
  },
];

const LEVERS = [
  {
    l: 'Dream Outcome',
    d: 'Does the offer describe the actual end state they want?',
    c: '#2B7BD4',
  },
  {
    l: 'Perceived Likelihood',
    d: "Do they believe it'll work — for them, not someone like them?",
    c: '#D4890A',
  },
  {
    l: 'Time Delay',
    d: 'How many days until they see the result?',
    c: '#E8530E',
  },
  {
    l: 'Effort & Sacrifice',
    d: 'What do they have to give up to say yes?',
    c: '#6B6860',
  },
];

const FAQ = [
  {
    q: 'Is this actually free, or do I get upsold halfway through?',
    a: "Free. You'll see your scan, findings, and a rebuilt mockup without paying. At the end, we pitch our build service — you can ignore it, screenshot the findings, and execute yourself.",
  },
  {
    q: 'How is this different from a generic website audit?',
    a: 'Generic audits give you a list of opinions. We tie every finding to a specific Value Equation lever, quote the exact line on your page, and translate the leak into a 12-month dollar figure backed by a public benchmark.',
  },
  {
    q: 'Do you store my site data?',
    a: 'Screenshots for 30 days so you can reshare the findings. URL + email/phone kept for follow-up — unsubscribe removes both.',
  },
];

const TRUST_ITEMS = [
  'Free, no card',
  '5 funnel stages',
  '~90s scan time',
  'For $500K–$5M service firms',
];

export function LandingDesktop({ headline = 'A' }: LandingDesktopProps) {
  return (
    <div className="scanner-page landing-desktop">
      <TopNav />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ padding: '100px 48px 120px' }}>
        <div aria-hidden className="landing-hero-watermark">F</div>
        <div aria-hidden className="landing-hero-radial" />
        <div className="relative mx-auto" style={{ maxWidth: 1100 }}>
          {/* Badge */}
          <div
            className="inline-flex items-center mb-7"
            style={{
              gap: 10,
              padding: '6px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 50,
                background: 'var(--accent)',
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
              }}
            >
              Free revenue audit
            </span>
          </div>

          <h1 className="display-900 m-0" style={{ fontSize: 88, maxWidth: 1040 }}>
            {headline === 'A' ? (
              <>
                Your funnel is{' '}
                <span
                  style={{
                    textDecoration: 'line-through',
                    textDecorationColor: 'var(--text-muted)',
                    textDecorationThickness: 3,
                  }}
                >
                  running
                </span>
                <br />
                leaking revenue.{' '}
                <span style={{ color: 'var(--accent)' }}>Let&apos;s find where.</span>
              </>
            ) : (
              <>
                AI isn&apos;t magic. It&apos;s
                <br />
                infrastructure.{' '}
                <span style={{ color: 'var(--accent)' }}>
                  See what yours is missing.
                </span>
              </>
            )}
          </h1>

          <p
            className="body"
            style={{
              fontSize: 20,
              color: 'var(--text-2)',
              marginTop: 32,
              maxWidth: 640,
              lineHeight: 1.55,
            }}
          >
            We scan your site, socials, and ads — then hand you a prosecutor&apos;s case
            on what&apos;s costing you customers. Real screenshots. Specific fixes.
            Dollar figures, not adjectives.
          </p>

          <div className="mt-10">
            <ScanForm variant="hero" />
          </div>

          <div className="mt-[18px] flex" style={{ gap: 28 }}>
            {TRUST_ITEMS.map((t) => (
              <span
                key={t}
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                · {t}
              </span>
            ))}
          </div>

          {/* Hero preview card */}
          <div
            className="mt-[72px] grid items-stretch"
            style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}
          >
            <div className="ds-card shadow-amb" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: '#D93636' }} />
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: '#D4890A' }} />
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: '#2D8C4E' }} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  scanner.forgewith.ai · LIVE
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>
                  ● SCANNING
                </span>
              </div>
              <div className="relative" style={{ height: 340, padding: 20 }}>
                <PhImg label="Sample landing screenshot · annotating" aspect="unset" height={300} />
                <span className="ann-pin pin-critical absolute" style={{ left: '22%', top: '30%' }}>
                  1
                </span>
                <span className="ann-pin pin-warning absolute" style={{ left: '58%', top: '60%' }}>
                  2
                </span>
                <span
                  className="ann-pin pin-opportunity absolute"
                  style={{ left: '80%', top: '25%' }}
                >
                  3
                </span>
              </div>
              <div
                className="mono"
                style={{
                  padding: '10px 18px',
                  borderTop: '1px solid var(--border)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Sample preview — your scan annotates your real screenshots
              </div>
            </div>

            {/* Side callout */}
            <div className="flex flex-col" style={{ gap: 16 }}>
              <div className="card-ink" style={{ padding: 22 }}>
                <Eyebrow style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  Biggest leak · sample
                </Eyebrow>
                <div className="flex items-baseline" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--accent-bright)' }}>
                    $
                  </span>
                  <span
                    className="display-900"
                    style={{
                      fontSize: 58,
                      color: 'var(--ink-text)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    184,320
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--ink-text-2)', marginTop: 6 }}
                >
                  EXAMPLE · LEFT ON TABLE · NEXT 12 MONTHS
                </div>
                <div className="hair" style={{ background: 'rgba(255,255,255,0.08)', margin: '18px 0' }} />
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {[
                    ['Lead capture', 'Missing'],
                    ['Speed-to-lead', 'Weak'],
                    ['Follow-up system', 'Missing'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="body" style={{ fontSize: 13, color: 'var(--ink-text)' }}>
                        {k}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: v === 'Missing' ? 'var(--critical)' : 'var(--warning)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="ds-card"
                style={{
                  padding: 20,
                  background: 'var(--surface)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <Eyebrow accent style={{ marginBottom: 10 }}>
                  Contrarian take
                </Eyebrow>
                <p className="display m-0" style={{ fontSize: 20, lineHeight: 1.3 }}>
                  AI isn&apos;t magic. It&apos;s{' '}
                  <span style={{ color: 'var(--accent)' }}>infrastructure.</span> And
                  infrastructure takes engineering, not prompts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{ background: 'var(--surface)', padding: '100px 48px' }}
      >
        <div className="mx-auto" style={{ maxWidth: 1240 }}>
          <div
            className="flex justify-between items-end"
            style={{ marginBottom: 56 }}
          >
            <div>
              <Eyebrow accent>How it works</Eyebrow>
              <h2
                className="display-900"
                style={{ fontSize: 56, margin: '12px 0 0', maxWidth: 640, lineHeight: 1.05 }}
              >
                Four stages. Ninety seconds. One verdict.
              </h2>
            </div>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                maxWidth: 320,
                textAlign: 'right',
              }}
            >
              No config. Paste your URL. The rest happens on our servers.
            </div>
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(4, 1fr)',
              background: 'var(--base)',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--border-strong)',
            }}
          >
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                style={{
                  padding: '36px 28px',
                  borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                  position: 'relative',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    letterSpacing: '0.14em',
                  }}
                >
                  {s.n}
                </span>
                <h3 className="display" style={{ fontSize: 28, margin: '20px 0 12px' }}>
                  {s.t}
                </h3>
                <p
                  className="body m-0"
                  style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}
                >
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHOD CARDS */}
      <section style={{ padding: '100px 48px' }}>
        <div className="mx-auto" style={{ maxWidth: 1240 }}>
          <Eyebrow accent>The four levers we test against</Eyebrow>
          <h2
            className="display-900"
            style={{ fontSize: 48, margin: '12px 0 12px', maxWidth: 820, lineHeight: 1.08 }}
          >
            Every finding is tied to one of four things people actually decide on.
          </h2>
          <p
            className="body"
            style={{
              fontSize: 16,
              color: 'var(--text-2)',
              maxWidth: 680,
              marginTop: 0,
            }}
          >
            We use Hormozi&apos;s Value Equation as our audit framework. Dream Outcome ×
            Perceived Likelihood, divided by Time Delay × Effort. If a finding
            doesn&apos;t move one of these, we don&apos;t report it.
          </p>
          <div
            className="grid mt-12"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
          >
            {LEVERS.map((x) => (
              <div
                key={x.l}
                className="ds-card"
                style={{
                  background: 'var(--base)',
                  borderColor: 'var(--border-strong)',
                  padding: 24,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: x.c,
                    marginBottom: 18,
                  }}
                />
                <h4 className="display" style={{ fontSize: 20, margin: '0 0 10px' }}>
                  {x.l}
                </h4>
                <p
                  className="body m-0"
                  style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}
                >
                  {x.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE FINDING — dark ink section */}
      <section
        id="sample"
        className="relative overflow-hidden"
        style={{ background: 'var(--ink)', color: 'var(--ink-text)', padding: '100px 48px' }}
      >
        <div
          className="dot-grid-dark absolute"
          style={{ inset: 0, opacity: 0.5 }}
        />
        <div
          className="relative mx-auto grid items-center"
          style={{
            maxWidth: 1240,
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: 64,
          }}
        >
          <div>
            <Eyebrow style={{ color: 'var(--ink-text-2)' }}>A sample finding</Eyebrow>
            <h2
              className="display-900"
              style={{ fontSize: 54, margin: '14px 0 16px', lineHeight: 1.05 }}
            >
              Not &quot;your hero is weak.&quot;
              <br />
              <span style={{ color: 'var(--accent-bright)' }}>
                Here&apos;s the exact line, why it fails, and what it&apos;s costing.
              </span>
            </h2>
            <p
              className="body"
              style={{
                fontSize: 16,
                color: 'var(--ink-text-2)',
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              Generic audits say &quot;improve your hero.&quot; We quote your hero back
              to you, mark which lever it breaks, and show the dollar delta — grounded
              in a public benchmark, not vibes.
            </p>
          </div>
          <div
            style={{
              background: 'var(--ink-card)',
              borderRadius: 12,
              padding: 32,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: 18 }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-text-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Sample finding · Landing experience
              </span>
              <span className="chip chip-critical">Critical</span>
            </div>
            <div
              style={{
                padding: '16px 18px',
                background: 'rgba(255,255,255,0.03)',
                borderLeft: '3px solid var(--accent)',
                fontFamily: 'var(--font-body)',
                fontSize: 15.5,
                color: 'var(--ink-text)',
                lineHeight: 1.55,
                marginBottom: 20,
              }}
            >
              &quot;Welcome to [Your Business] — where your journey to [vague outcome] begins.&quot;
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--ink-text-2)',
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              sample finding — your scan will quote your actual hero.
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}
            >
              <div>
                <Eyebrow style={{ color: 'var(--ink-text-2)', marginBottom: 8 }}>
                  Lever it breaks
                </Eyebrow>
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: '#6fb3ff',
                    padding: '4px 8px',
                    background: 'rgba(43,123,212,0.12)',
                    border: '1px solid rgba(43,123,212,0.3)',
                    borderRadius: 4,
                  }}
                >
                  DREAM OUTCOME
                </span>
              </div>
              <div>
                <Eyebrow style={{ color: 'var(--ink-text-2)', marginBottom: 8 }}>
                  12-mo. cost
                </Eyebrow>
                <span
                  className="mono"
                  style={{
                    fontSize: 20,
                    color: 'var(--accent-bright)',
                    fontWeight: 700,
                  }}
                >
                  $38k – $72k
                </span>
              </div>
            </div>
            <p
              className="body m-0"
              style={{
                fontSize: 14,
                color: 'var(--ink-text-2)',
                lineHeight: 1.6,
              }}
            >
              Customers don&apos;t want &quot;a journey.&quot; They want a dated, specific
              outcome — by their next event, deadline, or season. Lead with that and
              Hormozi&apos;s 8–15% conversion lift applies directly.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '100px 48px' }}>
        <div className="mx-auto" style={{ maxWidth: 1000 }}>
          <Eyebrow accent>FAQ</Eyebrow>
          <h2 className="display-900" style={{ fontSize: 48, margin: '14px 0 56px' }}>
            Questions we get before you give us a URL.
          </h2>
          <div>
            {FAQ.map((f, i) => (
              <div
                key={f.q}
                className="grid"
                style={{
                  padding: '24px 0',
                  borderBottom:
                    i < FAQ.length - 1 ? '1px solid var(--border-strong)' : 'none',
                  gridTemplateColumns: '40px 1fr',
                  gap: 20,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--accent)', paddingTop: 4 }}
                >
                  0{i + 1}
                </span>
                <div>
                  <h4 className="display" style={{ fontSize: 20, margin: '0 0 10px' }}>
                    {f.q}
                  </h4>
                  <p
                    className="body m-0"
                    style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}
                  >
                    {f.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '0 48px 80px' }}>
        <div
          className="mx-auto relative overflow-hidden"
          style={{
            maxWidth: 1240,
            background: 'var(--ink)',
            borderRadius: 12,
            padding: '72px 56px',
          }}
        >
          <div
            className="dot-grid-dark absolute"
            style={{ inset: 0, opacity: 0.6 }}
          />
          <div
            className="relative grid items-center"
            style={{ gridTemplateColumns: '1.3fr 1fr', gap: 48 }}
          >
            <div>
              <h2
                className="display-900 m-0"
                style={{ fontSize: 56, color: 'var(--ink-text)', lineHeight: 1.05 }}
              >
                Want the diagnosis
                <br />
                or the surgery?
              </h2>
              <p
                className="body"
                style={{
                  fontSize: 18,
                  color: 'var(--ink-text-2)',
                  marginTop: 20,
                  maxWidth: 480,
                }}
              >
                The scan is free — that&apos;s the diagnosis. The rebuild is the surgery.
                Start with the first.
              </p>
            </div>
            <ScanForm variant="cta-dark" buttonLabel="Scan →" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

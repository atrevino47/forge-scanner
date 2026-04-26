import { TopNav, Eyebrow } from '@/components/design-system/primitives';
import { StageScoreCard } from './StageScoreCard';
import { MoneyModelCard } from './MoneyModelCard';
import { VoiceAgentCard } from './VoiceAgentCard';
import { StoryChapter } from './StoryChapter';
import { SAMPLE_SCORE_DATA, type StageScore } from './results-data';

interface ResultsDesktopProps {
  voice?: boolean;
  scanShortId?: string;
  domain?: string;
  totalLeak?: string;
  findingCount?: number;
  stageCount?: number;
  stageScores?: StageScore[];
  scanDuration?: string;
  onBookCall?: () => void;
  onViewBlueprint?: () => void;
  onShare?: () => void;
}

export function ResultsDesktop({
  voice = true,
  scanShortId = '5f2a-91c0',
  domain = 'your funnel',
  totalLeak = '$322k',
  findingCount = 17,
  stageCount = 5,
  stageScores,
  scanDuration = '94s',
  onBookCall,
  onViewBlueprint,
  onShare,
}: ResultsDesktopProps) {
  const scores = stageScores ?? SAMPLE_SCORE_DATA;
  return (
    <div className="scanner-page" style={{ width: '100%' }}>
      <TopNav compact ctaLabel="Download PDF" />

      {/* Header */}
      <section style={{ padding: '36px 48px 24px', background: 'var(--base)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <Eyebrow accent>
                Audit complete · scan #{scanShortId} · {scanDuration}
              </Eyebrow>
              <h1
                className="display-900"
                style={{ fontSize: 56, margin: '12px 0 6px', lineHeight: 1.05 }}
              >
                We found{' '}
                <span style={{ color: 'var(--accent)' }}>{totalLeak}</span> leaking
                <br />
                from {domain}
              </h1>
              <p
                className="body"
                style={{
                  fontSize: 17,
                  color: 'var(--text-2)',
                  margin: '16px 0 0',
                  maxWidth: 680,
                }}
              >
                {findingCount} findings across {stageCount} funnel stages. Each
                tagged with the Value Equation lever it breaks, grounded in a public
                benchmark, and translated into a 12-month dollar range.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onShare}>Share link</button>
              <button type="button" className="btn btn-primary" onClick={onBookCall}>Book strategy call →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Voice agent prominent at top */}
      {voice && (
        <section style={{ padding: '16px 48px 24px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <VoiceAgentCard />
          </div>
        </section>
      )}

      {/* Per-stage score grid */}
      <section style={{ padding: '24px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 20,
            }}
          >
            <h2 className="display-900" style={{ fontSize: 28, margin: 0 }}>
              Per-stage scores
            </h2>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              tap any to jump to chapter
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}
          >
            {scores.map((s) => (
              <StageScoreCard
                key={s.key}
                stage={s.stage}
                score={s.score}
                severity={s.severity}
                weakest={s.weakest}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Money Model overlay */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <MoneyModelCard totalLeak={totalLeak} />
        </div>
      </section>

      {/* Story chapters */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow accent>The prosecutor&apos;s case</Eyebrow>
            <h2
              className="display-900"
              style={{ fontSize: 44, margin: '14px 0 10px', lineHeight: 1.05 }}
            >
              Five chapters. One verdict.
            </h2>
            <p
              className="body"
              style={{
                fontSize: 16,
                color: 'var(--text-2)',
                margin: 0,
                maxWidth: 640,
              }}
            >
              Situation → Complication → So what → Fix. Every chapter grounded in one
              thing you can verify.
            </p>
          </div>

          <StoryChapter
            num="01"
            stage="Landing experience · score 41"
            situation={{
              title: 'Your hero sells a journey. Customers want a deadline.',
              shot: 'your-site.com · above fold · EXAMPLE',
              body: 'EXAMPLE current hero: "Welcome — where your journey begins." No dated outcome. No price anchor. No proof element above the fold. The CTA says "Book consultation" — another step, no commitment.',
            }}
            annotations={[
              { t: 'critical', x: 25, y: 28 },
              { t: 'critical', x: 62, y: 40 },
              { t: 'warning', x: 30, y: 78 },
            ]}
            lever={{
              name: 'Dream Outcome',
              body: 'The customer isn’t buying the process — they’re buying a specific outcome by their next deadline. Name the outcome. Date it.',
            }}
            cost={{
              range: 'EXAMPLE $38k – $72k',
              benchmark:
                'Hormozi benchmark: 8–15% conversion lift from specific vs. generic hero. SAMPLE 2,400 monthly visitors × 2.8% baseline = $46k midpoint.',
            }}
            fix={
              'Swap to: “Specific outcome by your next deadline — or your next visit is free.” Add a before/after rotation and “Book a free 20-minute plan” as the CTA.'
            }
          />

          <StoryChapter
            num="02"
            stage="Lead capture · score 28"
            situation={{
              title: 'Your form has 11 fields. The industry average converts at 3.',
              shot: 'your-site.com/book · desktop · EXAMPLE',
              body: 'EXAMPLE: name, email, phone, date of birth, address, preference, concern, history, referral source, preferred staff, notes. A prospect at peak intent is asked to complete a full intake before they’ve seen a price.',
            }}
            annotations={[
              { t: 'critical', x: 45, y: 35 },
              { t: 'critical', x: 45, y: 68 },
            ]}
            lever={{
              name: 'Effort & Sacrifice',
              body: 'Every extra field compounds — the decision cost to convert doubles around field 5. Detailed intake should happen AFTER the micro-yes, not before it.',
            }}
            cost={{
              range: 'EXAMPLE $62k – $91k',
              benchmark:
                'Baymard: form abandonment jumps from 22% at 3 fields to 71% at 10+ fields. Applied to a SAMPLE 2,400 monthly visitors.',
            }}
            fix="Collapse to 3 fields (name, email, phone). Move detailed intake to a follow-up smartform emailed after the booking. Speed-to-lead target: 5 minutes."
          />

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <button className="btn btn-secondary">Show chapters 3 – 5 ↓</button>
          </div>
        </div>
      </section>

      {/* Give-Two-Pick-One */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            className="ds-card"
            style={{
              padding: 40,
              borderColor: 'var(--border-strong)',
              background: 'var(--surface)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Eyebrow accent>Not ready to book yet?</Eyebrow>
              <h3
                className="display-900"
                style={{ fontSize: 34, margin: '12px 0 8px' }}
              >
                Take something with you.
              </h3>
              <p
                className="body"
                style={{ fontSize: 15, color: 'var(--text-2)', margin: 0 }}
              >
                Both are free. Pick the one you&apos;d actually open.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              {[
                {
                  t: 'Full PDF audit',
                  d: 'Every finding, every benchmark, every recommended fix in one document you can forward to your team.',
                },
                {
                  t: 'Public teardown drops',
                  d: 'When we publish a new public teardown of a real business, you’ll be the first to see it.',
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="ds-card"
                  style={{
                    background: 'var(--base)',
                    padding: 24,
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <h4 className="display" style={{ fontSize: 20, margin: '0 0 8px' }}>
                    {x.t}
                  </h4>
                  <p
                    className="body"
                    style={{
                      fontSize: 13.5,
                      color: 'var(--text-2)',
                      margin: '0 0 18px',
                      lineHeight: 1.55,
                    }}
                  >
                    {x.d}
                  </p>
                  <button className="btn btn-dark" style={{ width: '100%' }}>
                    Send it to me
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '20px 48px 80px' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            background: 'var(--ink)',
            borderRadius: 12,
            padding: '48px 40px',
            color: 'var(--ink-text)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="dot-grid-dark"
            style={{ position: 'absolute', inset: 0, opacity: 0.5 }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 32,
            }}
          >
            <div>
              <h3
                className="display-900"
                style={{ fontSize: 38, margin: 0, lineHeight: 1.05 }}
              >
                See the rebuilt offer page.
              </h3>
              <p
                className="body"
                style={{
                  fontSize: 15,
                  color: 'var(--ink-text-2)',
                  margin: '10px 0 0',
                }}
              >
                We already drafted what your weakest stage should look like. Takes 30
                seconds to view.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-lg" onClick={onViewBlueprint}>View the Blueprint →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { MobileNav, Eyebrow, StatusDot } from '@/components/design-system/primitives';
import { SAMPLE_SCORE_DATA, SAMPLE_MONEY_LAYERS, type StageScore } from './results-data';

interface ResultsMobileProps {
  voice?: boolean;
  totalLeak?: string;
  agentName?: string;
  findingCount?: number;
  stageCount?: number;
  stageScores?: StageScore[];
  scanDuration?: string;
  onBookCall?: () => void;
  onViewBlueprint?: () => void;
}

export function ResultsMobile({
  voice = true,
  totalLeak = '$322k',
  agentName = '[VOICE_AGENT_NAME]',
  findingCount = 17,
  stageCount = 5,
  stageScores,
  scanDuration = '94s',
  onBookCall,
  onViewBlueprint,
}: ResultsMobileProps) {
  const scores = stageScores ?? SAMPLE_SCORE_DATA;
  // Mark vars as used so TS allow-any holds
  void onBookCall;
  void onViewBlueprint;
  const initial = agentName.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'V';
  return (
    <div className="scanner-page" style={{ width: '100%' }}>
      <MobileNav />
      <section style={{ padding: '24px 20px' }}>
        <Eyebrow accent>Audit complete · {scanDuration}</Eyebrow>
        <h1
          className="display-900"
          style={{ fontSize: 30, margin: '10px 0 10px', lineHeight: 1.1 }}
        >
          <span style={{ color: 'var(--accent)' }}>{totalLeak}</span> leaking from
          your funnel
        </h1>
        <p className="body" style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          {findingCount} findings · {stageCount} stages
        </p>

        {voice && (
          <div
            style={{
              background: 'var(--ink)',
              borderRadius: 12,
              padding: 18,
              color: 'var(--ink-text)',
              marginTop: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #353533, #1E1E1C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 22,
                  color: 'var(--accent-bright)',
                }}
              >
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>
                  {agentName}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--ink-text-2)' }}
                >
                  4 MIN WALKTHROUGH
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14 }}
            >
              ▶ Tap to listen
            </button>
          </div>
        )}

        {/* Score list */}
        <div style={{ marginTop: 24 }}>
          <Eyebrow>Per-stage scores</Eyebrow>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {scores.map((s) => (
              <div
                key={s.key}
                className="ds-card"
                style={{
                  padding: 16,
                  borderColor: s.weakest
                    ? 'var(--accent)'
                    : 'var(--border-strong)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <Eyebrow>{s.stage}</Eyebrow>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      <span className="display-900" style={{ fontSize: 28 }}>
                        {s.score}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--text-muted)' }}
                      >
                        /100
                      </span>
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color:
                        s.score >= 60 ? 'var(--warning)' : 'var(--critical)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {s.severity}
                  </span>
                </div>
                <div className="score-bar" style={{ marginTop: 10 }}>
                  <span
                    style={{
                      width: `${s.score}%`,
                      background:
                        s.score >= 60 ? 'var(--warning)' : 'var(--critical)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money Model compact */}
        <div style={{ marginTop: 32 }}>
          <Eyebrow accent>Money Model · EXAMPLE</Eyebrow>
          <h3
            className="display-900"
            style={{ fontSize: 22, margin: '8px 0 14px', lineHeight: 1.15 }}
          >
            Biggest leak: no upsell path ($164k / yr)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SAMPLE_MONEY_LAYERS.map((l) => (
              <div
                key={l.k}
                className="ds-card"
                style={{
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <StatusDot status={l.score} />
                  <span className="body" style={{ fontSize: 14, fontWeight: 500 }}>
                    {l.k}
                  </span>
                </div>
                <span
                  className="display-900"
                  style={{
                    fontSize: 18,
                    color:
                      l.score === 'missing' ? 'var(--accent)' : 'var(--text)',
                  }}
                >
                  {l.leak}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Give-Two-Pick-One */}
        <div
          style={{
            marginTop: 32,
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Eyebrow accent>Not ready to book?</Eyebrow>
          <h3
            className="display-900"
            style={{ fontSize: 20, margin: '8px 0 14px' }}
          >
            Take something free.
          </h3>
          <button
            className="btn btn-dark"
            style={{ width: '100%', marginBottom: 10 }}
          >
            Full PDF audit
          </button>
          <button className="btn btn-secondary" style={{ width: '100%' }}>
            Public teardown drops
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 52 }}
          >
            View Blueprint →
          </button>
        </div>
      </section>
    </div>
  );
}

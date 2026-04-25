import { MobileNav, Eyebrow, PhImg } from '@/components/design-system/primitives';

type MilestoneStatus = 'done' | 'active' | 'queued';

interface ScanMobileProps {
  scanId: string;
  domain?: string;
}

const MOBILE_MILESTONES: Array<[string, MilestoneStatus]> = [
  ['Crawling site', 'done'],
  ['Traffic sources', 'done'],
  ['Landing experience', 'active'],
  ['Lead capture', 'queued'],
  ['Offer & conversion', 'queued'],
  ['Follow-up', 'queued'],
];

export function ScanMobile({ scanId: _scanId, domain }: ScanMobileProps) {
  const target = domain ?? 'your site';

  return (
    <div className="scanner-page scan-mobile">
      <MobileNav />
      <section style={{ padding: '28px 20px' }}>
        <Eyebrow accent>Scan in progress</Eyebrow>
        <h1
          className="display-900"
          style={{ fontSize: 28, margin: '8px 0 0', lineHeight: 1.1 }}
        >
          Scanning <span style={{ color: 'var(--accent)' }}>{target}</span>
        </h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            ELAPSED 00:47
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            ETA 01:30
          </span>
        </div>
        <div
          style={{
            height: 3,
            background: 'var(--card)',
            borderRadius: 2,
            marginTop: 10,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '52%', height: '100%', background: 'var(--accent)' }} />
        </div>

        <div
          className="card"
          style={{
            marginTop: 24,
            padding: 0,
            overflow: 'hidden',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
              landing · desktop
            </span>
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 50,
                  background: 'var(--accent)',
                }}
              />{' '}
              ANNOTATING
            </span>
          </div>
          <div style={{ position: 'relative', padding: 12 }}>
            <PhImg label="landing screenshot" aspect="unset" height={240} />
            <span className="ann-pulse" style={{ left: '28%', top: '25%' }} />
            <span
              className="ann-pin pin-critical"
              style={{ left: '28%', top: '25%', position: 'absolute' }}
            >
              1
            </span>
            <span
              className="ann-pin pin-warning"
              style={{ left: '62%', top: '55%', position: 'absolute' }}
            >
              2
            </span>
            <span
              className="ann-pin pin-critical"
              style={{ left: '30%', top: '78%', position: 'absolute' }}
            >
              3
            </span>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Eyebrow>Milestones</Eyebrow>
          <div style={{ marginTop: 10 }}>
            {MOBILE_MILESTONES.map(([t, s], i) => (
              <div
                key={t}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom:
                    i < MOBILE_MILESTONES.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background:
                      s === 'done'
                        ? 'var(--positive)'
                        : s === 'active'
                        ? 'var(--accent)'
                        : 'var(--base)',
                    border: s === 'queued' ? '1px solid var(--border-strong)' : 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: s === 'queued' ? 'var(--text-muted)' : '#FAFAF7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s === 'done' ? '✓' : s === 'active' ? '●' : '·'}
                </div>
                <span
                  className="body"
                  style={{
                    fontSize: 14,
                    marginLeft: 10,
                    color: s === 'queued' ? 'var(--text-muted)' : 'var(--text)',
                  }}
                >
                  {t}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
            marginTop: 24,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: 'var(--surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1A1917 0%, #353533 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 16,
              color: 'var(--accent-bright)',
            }}
          >
            ◐
          </div>
          <div style={{ flex: 1 }}>
            <div className="body" style={{ fontSize: 13, fontWeight: 600 }}>
              [VOICE_AGENT_NAME] will walk you through it
            </div>
            <div
              className="mono"
              style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}
            >
              TAP TO ENABLE VOICE
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

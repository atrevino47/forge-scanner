import { MobileNav, Eyebrow, PhImg } from '@/components/design-system/primitives';
import type { Milestone, ScreenshotEntry, ScreenshotAnnotation } from './ScanDesktop';

type MilestoneStatus = 'done' | 'active' | 'queued';

interface ScanMobileProps {
  scanId: string;
  domain?: string;
  milestones?: Milestone[];
  currentScreenshot?: ScreenshotEntry;
  elapsed?: string;
  eta?: string;
  progressPct?: number;
}

const SAMPLE_MOBILE_MILESTONES: Array<[string, MilestoneStatus]> = [
  ['Crawling site', 'done'],
  ['Traffic sources', 'done'],
  ['Landing experience', 'active'],
  ['Lead capture', 'queued'],
  ['Offer & conversion', 'queued'],
  ['Follow-up', 'queued'],
];

const SAMPLE_MOBILE_ANNS: ScreenshotAnnotation[] = [
  { x: 28, y: 25, severity: 'critical' },
  { x: 62, y: 55, severity: 'warning' },
  { x: 30, y: 78, severity: 'critical' },
];

export function ScanMobile({
  scanId: _scanId,
  domain,
  milestones,
  currentScreenshot,
  elapsed,
  eta,
  progressPct,
}: ScanMobileProps) {
  const target = domain ?? 'your site';
  const elapsedStr = elapsed ?? '00:47';
  const etaStr = eta ?? '01:30';
  const pct = Math.max(0, Math.min(100, progressPct ?? 52));
  const milestonesArr: Array<[string, MilestoneStatus]> = milestones
    ? milestones.map((m) => [m.t, m.s])
    : SAMPLE_MOBILE_MILESTONES;
  const current = currentScreenshot;
  const annPins = current?.annotations ?? SAMPLE_MOBILE_ANNS;

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
            ELAPSED {elapsedStr}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            ETA {etaStr}
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
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
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
            {current?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.label}
                style={{ width: '100%', height: 240, objectFit: 'cover', objectPosition: 'top', display: 'block', borderRadius: 4 }}
              />
            ) : (
              <PhImg label={current?.label ?? 'landing screenshot'} aspect="unset" height={240} />
            )}
            {annPins.map((p, i) => (
              <span key={`m-pin-${i}`}>
                <span className="ann-pulse" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
                <span
                  className={`ann-pin pin-${p.severity}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, position: 'absolute' }}
                >
                  {i + 1}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Eyebrow>Milestones</Eyebrow>
          <div style={{ marginTop: 10 }}>
            {milestonesArr.map(([t, s], i) => (
              <div
                key={t}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom:
                    i < milestonesArr.length - 1 ? '1px solid var(--border)' : 'none',
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

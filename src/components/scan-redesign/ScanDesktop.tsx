import type { CSSProperties } from 'react';
import { TopNav, Eyebrow, PhImg } from '@/components/design-system/primitives';

type MilestoneStatus = 'done' | 'active' | 'queued';

interface Milestone {
  id: string;
  t: string;
  s: MilestoneStatus;
  detail: string;
}

interface ScanDesktopProps {
  scanId: string;
  domain?: string;
  voice?: boolean;
}

const MILESTONES: Milestone[] = [
  { id: 'crawl', t: 'Crawling site', s: 'done', detail: 'Pages + screenshots at 3 breakpoints' },
  { id: 'traffic', t: 'Traffic sources', s: 'done', detail: 'Channel + analytics detection' },
  { id: 'landing', t: 'Landing experience', s: 'active', detail: 'Vision pass · scoring elements' },
  { id: 'capture', t: 'Lead capture', s: 'queued', detail: 'Form fields, friction, speed-to-lead' },
  { id: 'offer', t: 'Offer & conversion', s: 'queued', detail: 'Value Equation cross-check' },
  { id: 'followup', t: 'Follow-up system', s: 'queued', detail: 'Email cadence, SMS, retargeting' },
];

const ACTIVITY_LOG: Array<[string, string, string]> = [
  ['00:02', '✓', 'Resolved DNS · origin reachable'],
  ['00:04', '✓', 'Robots.txt OK · sitemap indexed'],
  ['00:08', '✓', 'Captured page snapshots'],
  ['00:12', '✓', 'Mobile + tablet + desktop breakpoints'],
  ['00:18', '✓', 'Traffic channels detected'],
  ['00:24', '✓', 'Pixel + analytics check complete'],
  ['00:31', '✓', 'Scored: traffic source mix'],
  ['00:38', '●', 'Landing vision pass · analyzing hero'],
  ['00:41', '·', 'Cross-checking with benchmark db'],
  ['00:44', '·', 'Pinning annotations to pixels'],
  ['00:47', '◌', 'Queued: capture form analysis'],
];

function milestoneBadgeStyle(s: MilestoneStatus): CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: s === 'done' ? 'var(--positive)' : s === 'active' ? 'var(--accent)' : 'var(--base)',
    border: s === 'queued' ? '1px solid var(--border-strong)' : 'none',
    color: s === 'queued' ? 'var(--text-muted)' : '#FAFAF7',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    boxShadow: s === 'active' ? '0 0 0 3px rgba(232,83,14,0.12)' : 'none',
  };
}

export function ScanDesktop({ scanId, domain, voice = true }: ScanDesktopProps) {
  const shortId = scanId.slice(0, 8);
  const target = domain ?? 'your site';

  return (
    <div className="scanner-page scan-desktop">
      <TopNav compact ctaLabel="Cancel scan" />

      <section style={{ padding: '40px 48px 24px' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
          }}
        >
          <div>
            <Eyebrow accent>Scan in progress · ID {shortId}</Eyebrow>
            <h1 className="display-900" style={{ fontSize: 44, margin: '10px 0 0' }}>
              Scanning <span style={{ color: 'var(--accent)' }}>{target}</span>
            </h1>
            <p
              className="body"
              style={{ fontSize: 15, color: 'var(--text-2)', margin: '8px 0 0' }}
            >
              Don&apos;t close this tab. Findings stream in as we work — you&apos;ll see them live below.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}
            >
              ELAPSED / ETA
            </div>
            <div className="display-900" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
              00:47{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>/ 01:30</span>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1320,
            margin: '36px auto 0',
            height: 3,
            background: 'var(--card)',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '52%',
              height: '100%',
              background: 'var(--accent)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: -3,
                width: 9,
                height: 9,
                borderRadius: 50,
                background: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent)',
              }}
            />
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 48px 80px' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '320px 1fr 360px',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          {/* Milestones rail */}
          <div
            className="card"
            style={{
              padding: 20,
              background: 'var(--surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <Eyebrow>Milestones · {MILESTONES.length}</Eyebrow>
            <div style={{ marginTop: 16, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 6,
                  bottom: 6,
                  width: 1,
                  background: 'var(--border-strong)',
                }}
              />
              {MILESTONES.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    gap: 12,
                    padding: '10px 0',
                    position: 'relative',
                  }}
                >
                  <div style={milestoneBadgeStyle(m.s)}>
                    {m.s === 'done' ? '✓' : m.s === 'active' ? '●' : String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div
                      className="body"
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: m.s === 'queued' ? 'var(--text-muted)' : 'var(--text)',
                      }}
                    >
                      {m.t}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {m.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: live screenshot + streaming annotations */}
          <div>
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                background: 'var(--base)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#D93636', '#D4890A', '#2D8C4E'].map((c) => (
                    <span
                      key={c}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 50,
                        background: c,
                        opacity: 0.5,
                      }}
                    />
                  ))}
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  {target} · landing
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 50,
                      background: 'var(--accent)',
                      animation: 'blink 1.2s infinite',
                    }}
                  />
                  ANNOTATING
                </span>
              </div>
              <div style={{ position: 'relative', padding: 24 }}>
                <PhImg label="Landing page · desktop · 1440w" aspect="unset" height={520} />
                <span className="ann-pulse" style={{ left: '28%', top: '22%' }} />
                <span
                  className="ann-pin pin-critical"
                  style={{ left: '28%', top: '22%', position: 'absolute' }}
                >
                  1
                </span>
                <span
                  className="ann-pin pin-warning"
                  style={{ left: '62%', top: '35%', position: 'absolute' }}
                >
                  2
                </span>
                <span
                  className="ann-pin pin-critical"
                  style={{ left: '20%', top: '58%', position: 'absolute' }}
                >
                  3
                </span>
                <span className="ann-pulse" style={{ left: '75%', top: '72%' }} />
                <span
                  className="ann-pin pin-warning"
                  style={{ left: '75%', top: '72%', position: 'absolute' }}
                >
                  4
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginTop: 14,
              }}
            >
              {[
                { src: 'landing.jpg', state: 'CURRENT' },
                { src: 'capture-form.jpg', state: 'QUEUED' },
                { src: 'social-bio.jpg', state: 'QUEUED' },
              ].map(({ src, state }) => (
                <div
                  key={src}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 8,
                    borderColor: 'var(--border-strong)',
                    height: 110,
                    position: 'relative',
                  }}
                >
                  <PhImg label={src} aspect="unset" height={110} style={{ borderRadius: 0 }} />
                  <div
                    className="mono chip"
                    style={{ position: 'absolute', top: 8, left: 8, fontSize: 9 }}
                  >
                    {state}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div
            className="card-ink"
            style={{
              borderRadius: 12,
              padding: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.7,
              minHeight: 580,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: 'var(--ink-text-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                Activity log
              </span>
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--accent-bright)' }}
              >
                ● LIVE
              </span>
            </div>
            {ACTIVITY_LOG.map(([t, s, msg], i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 18px 1fr',
                  gap: 4,
                  color: i > 8 ? 'var(--ink-text-2)' : 'var(--ink-text)',
                }}
              >
                <span style={{ color: 'var(--ink-text-2)' }}>{t}</span>
                <span
                  style={{
                    color:
                      s === '●'
                        ? 'var(--accent-bright)'
                        : s === '✓'
                        ? 'var(--positive)'
                        : 'var(--ink-text-2)',
                  }}
                >
                  {s}
                </span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>

        {voice && (
          <div style={{ maxWidth: 1320, margin: '32px auto 0' }}>
            <div
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                borderColor: 'var(--border-strong)',
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1A1917 0%, #353533 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 22,
                  color: 'var(--accent-bright)',
                  border: '1px solid rgba(232,83,14,0.2)',
                }}
              >
                ◐
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span className="display" style={{ fontSize: 16, fontWeight: 700 }}>
                    [VOICE_AGENT_NAME]
                  </span>
                  <span className="chip chip-accent">Voice agent</span>
                </div>
                <p
                  className="body"
                  style={{
                    fontSize: 14,
                    color: 'var(--text-2)',
                    margin: 0,
                    maxWidth: 640,
                  }}
                >
                  Want me to walk you through the findings out loud when the scan wraps?
                  I&apos;ll highlight the 3 biggest leaks first — you can interrupt any time.
                </p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm">
                Not now
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                Yes, talk me through it
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

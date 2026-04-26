import { Eyebrow, StatusDot } from '@/components/design-system/primitives';
import { SAMPLE_MONEY_LAYERS } from './results-data';

interface MoneyModelCardProps {
  totalLeak?: string;
  calloutBody?: string;
}

export function MoneyModelCard({
  totalLeak = '$322k',
  calloutBody = 'EXAMPLE — A continuity layer (membership / retainer) for ~40% of buyers can close the largest leak in 6–9 months.',
}: MoneyModelCardProps) {
  return (
    <div
      className="ds-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        borderColor: 'var(--border-strong)',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          padding: '22px 24px',
          background: 'var(--ink)',
          color: 'var(--ink-text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>
              Money Model · Hormozi 4-layer
            </Eyebrow>
            <h3
              className="display-900"
              style={{ fontSize: 28, margin: '10px 0 0', lineHeight: 1.1 }}
            >
              You&apos;re running on one of four engines.
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              EXAMPLE total leak · 12 mo
            </div>
            <div
              className="display-900"
              style={{ fontSize: 26, color: 'var(--accent-bright)', marginTop: 4 }}
            >
              {totalLeak}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {SAMPLE_MONEY_LAYERS.map((l, i) => (
          <div
            key={l.k}
            style={{
              padding: 22,
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              background: l.biggest ? 'rgba(232,83,14,0.04)' : 'var(--base)',
              position: 'relative',
            }}
          >
            {l.biggest && (
              <div
                style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  right: -1,
                  height: 3,
                  background: 'var(--accent)',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <StatusDot status={l.score} />
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: 'var(--text-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                0{i + 1}
              </span>
            </div>
            <h4 className="display" style={{ fontSize: 18, margin: '0 0 6px' }}>
              {l.k}
            </h4>
            <p
              className="body"
              style={{
                fontSize: 13,
                color: 'var(--text-2)',
                margin: '0 0 14px',
                lineHeight: 1.5,
              }}
            >
              {l.note}
            </p>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              EXAMPLE leak
            </div>
            <div
              className="display-900"
              style={{
                fontSize: 22,
                color: l.biggest ? 'var(--accent)' : 'var(--text)',
                marginTop: 2,
                letterSpacing: '-0.02em',
              }}
            >
              {l.leak}
            </div>
          </div>
        ))}
      </div>
      {/* Biggest leak callout */}
      <div
        style={{
          padding: '18px 24px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <span className="chip chip-accent">Biggest leak</span>
        <p
          className="body"
          style={{
            fontSize: 14,
            color: 'var(--text)',
            margin: 0,
            flex: 1,
            lineHeight: 1.5,
          }}
        >
          {calloutBody}
        </p>
      </div>
    </div>
  );
}

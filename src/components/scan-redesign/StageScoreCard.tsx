import { Eyebrow } from '@/components/design-system/primitives';

interface StageScoreCardProps {
  stage: string;
  score: number;
  severity: string;
  weakest?: boolean;
}

export function StageScoreCard({ stage, score, severity, weakest }: StageScoreCardProps) {
  const color = score >= 60 ? 'var(--warning)' : 'var(--critical)';
  return (
    <div
      className="ds-card"
      style={{
        padding: 22,
        borderColor: weakest ? 'var(--accent)' : 'var(--border-strong)',
        borderRadius: 10,
        position: 'relative',
        background: '#FFF',
      }}
    >
      {weakest && (
        <span
          className="chip chip-accent"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          Weakest
        </span>
      )}
      <Eyebrow>{stage}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <span
          className="display-900"
          style={{ fontSize: 44, letterSpacing: '-0.03em' }}
        >
          {score}
        </span>
        <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          /100
        </span>
      </div>
      <div className="score-bar" style={{ marginTop: 10 }}>
        <span style={{ width: `${score}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {severity}
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          →
        </span>
      </div>
    </div>
  );
}

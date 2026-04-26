type LeverName =
  | 'Dream Outcome'
  | 'Perceived Likelihood'
  | 'Time Delay'
  | 'Effort & Sacrifice';

const LEVER_META: Record<LeverName, { color: string; bg: string }> = {
  'Dream Outcome': { color: '#2B7BD4', bg: 'rgba(43,123,212,0.08)' },
  'Perceived Likelihood': { color: '#D4890A', bg: 'rgba(212,137,10,0.08)' },
  'Time Delay': { color: '#E8530E', bg: 'rgba(232,83,14,0.08)' },
  'Effort & Sacrifice': { color: '#6B6860', bg: 'rgba(107,104,96,0.1)' },
};

interface LeverBadgeProps {
  lever: string;
}

export function LeverBadge({ lever }: LeverBadgeProps) {
  const m = LEVER_META[lever as LeverName] ?? LEVER_META['Time Delay'];
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.color}33`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 50, background: m.color }} />
      {lever}
    </span>
  );
}

interface VoiceAgentCardProps {
  agentName?: string;
  greeting?: string;
}

export function VoiceAgentCard({
  agentName = '[VOICE_AGENT_NAME]',
  greeting = '"Hi. I read your scan. Before we talk fixes, let me show you the three findings I\'d act on this week. Interrupt me any time."',
}: VoiceAgentCardProps) {
  const initial = agentName.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'V';
  return (
    <div
      style={{
        background: 'var(--ink)',
        borderRadius: 12,
        padding: 28,
        color: 'var(--ink-text)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="dot-grid-dark"
        style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 16,
            flexShrink: 0,
            position: 'relative',
            background: 'linear-gradient(135deg, #353533 0%, #1E1E1C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 34,
            color: 'var(--accent-bright)',
            border: '1px solid rgba(232,83,14,0.25)',
            boxShadow: '0 0 32px rgba(232,83,14,0.2)',
          }}
        >
          {initial}
          <span
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: 50,
              background: 'var(--positive)',
              border: '3px solid var(--ink)',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <h3
              className="display"
              style={{ fontSize: 22, margin: 0, color: 'var(--ink-text)' }}
            >
              {agentName}
            </h3>
            <span className="chip chip-dark">Ready</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-text-2)' }}>
              ~4 min walkthrough
            </span>
          </div>
          <p
            className="body"
            style={{
              fontSize: 15,
              color: 'var(--ink-text-2)',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            {greeting}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <button className="btn btn-primary" style={{ height: 48 }}>
            ▶ Tap to hear it
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--ink-text-2)' }}
          >
            or read it yourself
          </button>
        </div>
      </div>
    </div>
  );
}

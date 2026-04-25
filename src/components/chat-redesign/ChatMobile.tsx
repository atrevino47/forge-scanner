'use client';

interface ChatMobileProps {
  agentName?: string;
  agentInitial?: string;
  onClose?: () => void;
  onBookCall?: () => void;
  onEmailPlaybook?: () => void;
}

const MESSAGES: ReadonlyArray<{ s: 'v' | 'u'; m: string }> = [
  { s: 'v', m: "Hi. I'm here — finished reading your audit 30 seconds ago." },
  { s: 'v', m: 'Three things stood out. Want the one-minute version?' },
  { s: 'u', m: 'Yes. Short on time.' },
  { s: 'v', m: 'Your hero sells "a journey." Customers are shopping for an outcome on a date. Rewriting the headline alone is meaningful EXAMPLE upside.' },
  { s: 'v', m: 'Your intake form is too deep. Cutting fields recovers a measurable chunk.' },
];

export function ChatMobile({
  agentName = '[VOICE_AGENT_NAME]',
  agentInitial = 'V',
  onClose,
  onBookCall,
  onEmailPlaybook,
}: ChatMobileProps) {
  return (
    <div className="page" style={{ width: '100%', maxWidth: 375, margin: '0 auto', background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ink)', color: 'var(--ink-text)' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #353533, #1E1E1C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 14,
            color: 'var(--accent-bright)',
          }}
        >
          {agentInitial}
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 14, fontWeight: 700 }}>{agentName}</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-text-2)', textTransform: 'uppercase' }}>Read your scan</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chat" style={{ background: 'transparent', border: 'none', color: 'var(--ink-text-2)', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MESSAGES.map((x, i) => (
          <div
            key={i}
            style={{
              alignSelf: x.s === 'u' ? 'flex-end' : 'flex-start',
              maxWidth: '86%',
              background: x.s === 'u' ? 'var(--accent)' : 'var(--surface)',
              color: x.s === 'u' ? '#FAFAF7' : 'var(--text)',
              padding: '10px 12px',
              borderRadius: x.s === 'u' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            {x.m}
          </div>
        ))}

        <div style={{ alignSelf: 'flex-start', width: '86%', background: 'var(--ink)', color: 'var(--ink-text)', padding: 14, borderRadius: '12px 12px 12px 2px' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-text-2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Your move</div>
          <button type="button" className="btn btn-primary" style={{ width: '100%', marginBottom: 6, height: 38 }} onClick={onBookCall}>
            📅 Book w/ the team
          </button>
          <button
            type="button"
            className="btn"
            style={{ width: '100%', height: 38, background: 'rgba(255,255,255,0.06)', color: 'var(--ink-text)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={onEmailPlaybook}
          >
            📘 Email Offer Playbook
          </button>
        </div>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '6px 8px' }}>
          <input
            placeholder={`Ask ${agentName}…`}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, padding: '6px 4px' }}
          />
          <button type="button" aria-label="Voice input" style={{ background: 'transparent', border: 'none', color: 'var(--text-2)' }}>🎙</button>
          <button type="button" className="btn btn-primary btn-sm" style={{ height: 32 }}>→</button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { TopNav, Eyebrow } from '@/components/design-system/primitives';

interface ChatDesktopProps {
  agentName?: string;
  agentInitial?: string;
  findingsCount?: number;
  totalLeakDisplay?: string;
  onClose?: () => void;
  onBookCall?: () => void;
  onEmailPlaybook?: () => void;
}

const VEGA_PRELUDE: ReadonlyArray<string> = [
  'Hi. I just finished reading your audit about 30 seconds ago.',
  'Three things stood out. Want the one-minute version, or do you want me to walk chapter by chapter?',
];

const VEGA_FINDINGS: ReadonlyArray<string> = [
  'Got it. Three leaks, in order:',
  '1. Your hero sells "a journey." Customers are shopping for an outcome on a date. Rewriting the headline alone is meaningful EXAMPLE upside.',
  '2. Your intake form is too deep. Cutting fields and moving the rest downstream recovers a measurable chunk of conversion.',
  '3. You have no post-engagement path. A simple continuity offer at modest attach closes the largest of the three gaps.',
];

export function ChatDesktop({
  agentName = '[VOICE_AGENT_NAME]',
  agentInitial = 'V',
  findingsCount = 17,
  totalLeakDisplay = '$322k leak',
  onClose,
  onBookCall,
  onEmailPlaybook,
}: ChatDesktopProps) {
  return (
    <div className="page" style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      <TopNav compact />
      <section style={{ padding: '40px 48px', position: 'relative', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 440px', gap: 32, minHeight: 700 }}>
          {/* Behind: results skeleton */}
          <div style={{ background: 'var(--base)', borderRadius: 12, padding: 28, border: '1px solid var(--border-strong)' }}>
            <Eyebrow accent>Results · still open</Eyebrow>
            <h2 className="display-900" style={{ fontSize: 32, margin: '10px 0 20px', lineHeight: 1.1 }}>
              {findingsCount} findings · {totalLeakDisplay}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: 14, borderColor: 'var(--border)' }}>
                  <div className="skel" style={{ width: '30%', height: 10, marginBottom: 8 }} />
                  <div className="skel" style={{ width: '90%', height: 14, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '70%', height: 10 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div style={{ background: 'var(--base)', border: '1px solid var(--border-strong)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,20,19,0.04), 0 30px 80px -20px rgba(20,20,19,0.2)' }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--ink)', color: 'var(--ink-text)' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #353533, #1E1E1C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 16,
                  color: 'var(--accent-bright)',
                  border: '1px solid rgba(232,83,14,0.25)',
                  position: 'relative',
                }}
              >
                {agentInitial}
                <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 50, background: 'var(--positive)', border: '2px solid var(--ink)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>{agentName}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-text-2)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Read your scan · typing</div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close chat" style={{ background: 'transparent', border: 'none', color: 'var(--ink-text-2)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', background: 'var(--base)' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Today · just now</div>

              {VEGA_PRELUDE.map((m, i) => (
                <div key={`p${i}`} style={{ alignSelf: 'flex-start', maxWidth: '86%', background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 14, lineHeight: 1.5 }}>
                  {m}
                </div>
              ))}

              <div style={{ alignSelf: 'flex-end', maxWidth: '86%', background: 'var(--accent)', color: '#FAFAF7', padding: '12px 14px', borderRadius: '12px 12px 2px 12px', fontSize: 14, lineHeight: 1.5 }}>
                One-minute version. I&apos;m short on time.
              </div>

              {VEGA_FINDINGS.map((m, i) => (
                <div key={`v${i}`} style={{ alignSelf: 'flex-start', maxWidth: '86%', background: 'var(--surface)', padding: '12px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 14, lineHeight: 1.5 }}>
                  {m}
                </div>
              ))}

              {/* Give-two-pick-one */}
              <div style={{ alignSelf: 'flex-start', maxWidth: '86%', background: 'var(--ink)', color: 'var(--ink-text)', padding: 16, borderRadius: '12px 12px 12px 2px', fontSize: 14, lineHeight: 1.5 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-text-2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Your move</div>
                <div style={{ marginBottom: 12 }}>Pick what helps more right now:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button type="button" className="btn btn-primary" style={{ justifyContent: 'flex-start', height: 40 }} onClick={onBookCall}>
                    📅 Book 30 min with the team
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark"
                    style={{ justifyContent: 'flex-start', height: 40, background: 'rgba(255,255,255,0.06)', color: 'var(--ink-text)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={onEmailPlaybook}
                  >
                    📘 Email me the Offer Playbook
                  </button>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--base)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 10px' }}>
                <input
                  placeholder={`Ask ${agentName} anything about the audit…`}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 14, padding: '6px 4px' }}
                />
                <button type="button" aria-label="Voice input" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 16 }}>🎙</button>
                <button type="button" className="btn btn-primary btn-sm" style={{ height: 36 }}>Send</button>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', letterSpacing: '0.08em' }}>
                {agentName} is an AI. Answers are sourced from your scan and the Forge library.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

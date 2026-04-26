'use client';

import { useState } from 'react';
import { TopNav, MobileNav, Eyebrow } from '@/components/design-system/primitives';

interface CaptureGateProps {
  mobile?: boolean;
  findingCount?: number;
  stageCount?: number;
  onSubmit?: (email: string, phone: string) => void;
}

export function CaptureGate({
  mobile = false,
  findingCount = 17,
  stageCount = 5,
  onSubmit,
}: CaptureGateProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const pad = mobile ? 20 : 48;

  return (
    <div
      className="scanner-page"
      style={{ background: 'var(--base)' }}
    >
      {mobile ? <MobileNav /> : <TopNav compact />}
      <section
        style={{ padding: `${mobile ? 28 : 64}px ${pad}px`, position: 'relative' }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
          {/* Blurred content behind */}
          <div className="blur-gate">
            <Eyebrow accent>Your audit is ready</Eyebrow>
            <h1
              className="display-900"
              style={{
                fontSize: mobile ? 32 : 56,
                margin: '12px 0 24px',
                lineHeight: 1.05,
              }}
            >
              {findingCount} findings across {stageCount} stages.
            </h1>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="ds-card"
                  style={{
                    padding: 20,
                    height: mobile ? 120 : 180,
                    background: 'var(--surface)',
                  }}
                >
                  <div className="skel" style={{ width: '40%', height: 12, marginBottom: 10 }} />
                  <div className="skel" style={{ width: '80%', height: 18, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '100%', height: 10, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '60%', height: 10 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Modal */}
          <div
            style={{
              position: 'absolute',
              top: mobile ? 20 : 40,
              left: '50%',
              transform: 'translateX(-50%)',
              width: mobile ? 'calc(100% - 20px)' : 520,
              background: 'var(--base)',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              padding: mobile ? 24 : 36,
              boxShadow:
                '0 1px 2px rgba(20,20,19,0.05), 0 30px 80px -20px rgba(20,20,19,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <Eyebrow accent>Last step</Eyebrow>
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-muted)' }}
              >
                00:47 / 01:30
              </span>
            </div>
            <h2
              className="display-900"
              style={{ fontSize: mobile ? 26 : 32, margin: '0 0 14px', lineHeight: 1.1 }}
            >
              Where should we send the results?
            </h2>
            <p
              className="body"
              style={{
                fontSize: 14.5,
                color: 'var(--text-2)',
                margin: '0 0 24px',
                lineHeight: 1.55,
              }}
            >
              We&apos;ll email a shareable link and a one-page PDF summary. The phone is
              for the optional voice walkthrough — not for sales calls.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.(email, phone);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Work email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Phone · optional
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="input" style={{ width: 84, flex: 'none' }} defaultValue="+1">
                    <option>+1</option>
                  </select>
                  <input
                    className="input"
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8, height: 52 }}
              >
                Send me the results →
              </button>
            </form>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  border: '1.5px solid var(--border-strong)',
                  marginTop: 1,
                  flexShrink: 0,
                }}
              />
              <span
                className="body"
                style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}
              >
                Email me when new public teardowns drop — no spam, unsubscribe anytime.
              </span>
            </div>
            <p
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 18,
                lineHeight: 1.6,
                letterSpacing: '0.04em',
              }}
            >
              No spam. No sales rotation. Unsubscribe deletes your data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

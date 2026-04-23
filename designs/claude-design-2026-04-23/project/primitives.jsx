/* global React */
/* ═════════════════════════════════════════════════════════════
 * FORGE SCANNER — shared primitives (React)
 * ═════════════════════════════════════════════════════════════ */
const { useState, useEffect, useRef, useMemo } = React;

// ── FORGE logo (dark text + orange WITH.AI) ──
const ForgeLogo = ({ dark = false, size = 18 }) => (
  <span className={"logo " + (dark ? "logo-dark" : "")} style={{ fontSize: size }}>
    FORGE<span className="dot-orange">WITH.AI</span>
  </span>
);

// ── Nav bar (light + dark variants) ──
const TopNav = ({ dark = false, ctaLabel = "Scan my funnel", onCta, compact = false }) => (
  <header
    style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: compact ? "16px 24px" : "22px 32px",
      background: dark ? "var(--ink)" : "var(--base)",
      borderBottom: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid var(--border)",
      position: "relative", zIndex: 10,
    }}
  >
    <ForgeLogo dark={dark} size={compact ? 16 : 18} />
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <a className="mono" style={{ fontSize: 12, color: dark ? "var(--ink-text-2)" : "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em", textDecoration: "none" }}>How it works</a>
      <a className="mono" style={{ fontSize: 12, color: dark ? "var(--ink-text-2)" : "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em", textDecoration: "none" }}>Offer</a>
      <a className="mono" style={{ fontSize: 12, color: dark ? "var(--ink-text-2)" : "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em", textDecoration: "none" }}>FAQ</a>
      <button className={"btn btn-sm " + (dark ? "btn-primary" : "btn-dark")} onClick={onCta}>{ctaLabel}</button>
    </div>
  </header>
);

// ── Mobile nav ──
const MobileNav = ({ dark = false }) => (
  <header style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px",
    background: dark ? "var(--ink)" : "var(--base)",
    borderBottom: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid var(--border)",
  }}>
    <ForgeLogo dark={dark} size={15} />
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ width: 20, height: 1.5, background: dark ? "var(--ink-text)" : "var(--text)" }} />
      <div style={{ width: 20, height: 1.5, background: dark ? "var(--ink-text)" : "var(--text)" }} />
    </div>
  </header>
);

// ── Footer ──
const Footer = () => (
  <footer style={{ padding: "48px 32px 32px", background: "var(--surface)", marginTop: 80 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap", maxWidth: 1240, margin: "0 auto" }}>
      <div style={{ maxWidth: 320 }}>
        <ForgeLogo />
        <p className="body" style={{ fontSize: 13, color: "var(--text-2)", marginTop: 14, lineHeight: 1.6 }}>
          AI isn't magic. It's infrastructure. And infrastructure takes engineering, not prompts.
        </p>
      </div>
      <div style={{ display: "flex", gap: 48 }}>
        {["Scanner", "Offer", "Workbooks", "Teardowns"].map((g) => (
          <div key={g}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{g}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <a className="body" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Link</a>
              <a className="body" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Link</a>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="hair" style={{ maxWidth: 1240, margin: "32px auto 0" }} />
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>© 2026 FORGEWITH.AI</span>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>Built in Mexico City</span>
    </div>
  </footer>
);

// ── Placeholder image tile ──
const PhImg = ({ label = "Screenshot", aspect = "16/10", height, width = "100%", style = {} }) => (
  <div className="ph-img" style={{ width, aspectRatio: height ? undefined : aspect, height, borderRadius: 8, ...style }}>
    <div className="ph-label">{label}</div>
  </div>
);

// ── Eyebrow (mono uppercase label) ──
const Eyebrow = ({ children, accent = false, muted = false, style = {} }) => (
  <div className={"eyebrow " + (accent ? "eyebrow-accent" : "") + (muted ? "eyebrow-muted" : "")} style={style}>{children}</div>
);

// ── Annotation pin (absolute-positioned) ──
const AnnPin = ({ n, type = "critical", x, y, pulse = false, onClick, active = false }) => (
  <>
    {pulse && <span className="ann-pulse" style={{ left: `${x}%`, top: `${y}%` }} />}
    <button
      className={"ann-pin pin-" + type}
      onClick={onClick}
      style={{
        left: `${x}%`, top: `${y}%`,
        outline: active ? "3px solid rgba(232,83,14,0.3)" : "none",
        outlineOffset: 2,
      }}
    >
      {n}
    </button>
  </>
);

// ── Dot row (present/weak/missing) ──
const StatusDot = ({ status = "present" }) => <span className={"dot dot-" + status} />;

// ── Value Equation lever badge ──
const LEVER_META = {
  "Dream Outcome":    { color: "#2B7BD4", bg: "rgba(43,123,212,0.08)" },
  "Perceived Likelihood":  { color: "#D4890A", bg: "rgba(212,137,10,0.08)" },
  "Time Delay":       { color: "#E8530E", bg: "rgba(232,83,14,0.08)" },
  "Effort & Sacrifice": { color: "#6B6860", bg: "rgba(107,104,96,0.1)" },
};
const LeverBadge = ({ lever }) => {
  const m = LEVER_META[lever] || LEVER_META["Time Delay"];
  return (
    <span className="mono" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 8px", borderRadius: 4,
      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
      color: m.color, background: m.bg, border: `1px solid ${m.color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 50, background: m.color }} />
      {lever}
    </span>
  );
};

// ── Tweak panel (floating) ──
const TweaksPanel = ({ state, onChange, onClose }) => (
  <div style={{
    position: "fixed", bottom: 20, right: 20, width: 280,
    background: "var(--ink)", color: "var(--ink-text)",
    borderRadius: 12, padding: 18, zIndex: 9999,
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontFamily: "var(--font-body)", fontSize: 13,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-text-2)" }}>Tweaks</span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink-text-2)", cursor: "pointer", fontSize: 14 }}>✕</button>
    </div>
    {/* Headline variant */}
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Landing headline</div>
      <div style={{ display: "flex", gap: 6 }}>
        {["A", "B"].map((k) => (
          <button key={k} onClick={() => onChange({ headline: k })}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
              background: state.headline === k ? "var(--accent)" : "transparent",
              color: state.headline === k ? "#FAFAF7" : "var(--ink-text)",
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{k}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginTop: 6, lineHeight: 1.5 }}>
        {state.headline === "A" ? "A: Your funnel is leaking revenue..." : "B: AI isn't magic. It's infrastructure..."}
      </div>
    </div>
    {/* Voice agent */}
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Voice agent</div>
      <div style={{ display: "flex", gap: 6 }}>
        {["On", "Off"].map((k) => (
          <button key={k} onClick={() => onChange({ voice: k === "On" })}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
              background: (state.voice ? "On" : "Off") === k ? "var(--accent)" : "transparent",
              color: (state.voice ? "On" : "Off") === k ? "#FAFAF7" : "var(--ink-text)",
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{k}</button>
        ))}
      </div>
    </div>
    {/* Industry */}
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Grand Slam industry</div>
      <select value={state.industry} onChange={(e) => onChange({ industry: e.target.value })}
        style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
          background: "var(--ink-card)", color: "var(--ink-text)", fontFamily: "var(--font-body)", fontSize: 12 }}>
        <option value="medspa">Med spa / aesthetics</option>
        <option value="hvac">HVAC / home services</option>
        <option value="law">Personal injury law</option>
      </select>
    </div>
    {/* Accent intensity */}
    <div>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Accent: {state.accent}</div>
      <input type="range" min="0.7" max="1" step="0.05" value={state.accent}
        onChange={(e) => onChange({ accent: parseFloat(e.target.value) })}
        style={{ width: "100%" }} />
    </div>
  </div>
);

// expose globally
Object.assign(window, { ForgeLogo, TopNav, MobileNav, Footer, PhImg, Eyebrow, AnnPin, StatusDot, LeverBadge, TweaksPanel });

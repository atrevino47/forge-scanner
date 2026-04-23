/* global React, TopNav, MobileNav, PhImg, Eyebrow */

// ─────────────────────────────────────────────────────────────
// SCAN IN PROGRESS — desktop
// ─────────────────────────────────────────────────────────────
const ScanDesktop = ({ voice = true }) => {
  const milestones = [
    { id: "crawl", t: "Crawling site", s: "done", detail: "12 pages · 34 screenshots at 3 breakpoints" },
    { id: "traffic", t: "Traffic sources", s: "done", detail: "3 channels detected · GA4 connected" },
    { id: "landing", t: "Landing experience", s: "active", detail: "Vision pass · 4 of 7 elements scored" },
    { id: "capture", t: "Lead capture", s: "queued", detail: "Form fields, friction, speed-to-lead" },
    { id: "offer", t: "Offer & conversion", s: "queued", detail: "Value Equation cross-check" },
    { id: "followup", t: "Follow-up system", s: "queued", detail: "Email cadence, SMS, retargeting" },
  ];
  return (
    <div className="page" style={{ width: 1440 }}>
      <TopNav compact ctaLabel="Cancel scan" />
      <section style={{ padding: "40px 48px 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Eyebrow accent>Scan in progress · ID 5f2a-91c0</Eyebrow>
            <h1 className="display-900" style={{ fontSize: 44, margin: "10px 0 0" }}>
              Scanning <span style={{ color: "var(--accent)" }}>brightskinclinic.com</span>
            </h1>
            <p className="body" style={{ fontSize: 15, color: "var(--text-2)", margin: "8px 0 0" }}>
              Don't close this tab. Findings stream in as we work — you'll see them live below.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>ELAPSED / ETA</div>
            <div className="display-900" style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
              00:47 <span style={{ color: "var(--text-muted)", fontSize: 20 }}>/ 01:30</span>
            </div>
          </div>
        </div>
        {/* progress bar */}
        <div style={{ maxWidth: 1320, margin: "36px auto 0", height: 3, background: "var(--card)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
          <div style={{ width: "52%", height: "100%", background: "var(--accent)", position: "relative" }}>
            <div style={{ position: "absolute", right: 0, top: -3, width: 9, height: 9, borderRadius: 50, background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
          </div>
        </div>
      </section>

      <section style={{ padding: "24px 48px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr 360px", gap: 24, alignItems: "flex-start" }}>
          {/* ── Milestones left rail ── */}
          <div className="card" style={{ padding: 20, background: "var(--surface)", borderColor: "var(--border-strong)" }}>
            <Eyebrow>Milestones · 6</Eyebrow>
            <div style={{ marginTop: 16, position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: 6, bottom: 6, width: 1, background: "var(--border-strong)" }} />
              {milestones.map((m, i) => (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, padding: "10px 0", position: "relative" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    background: m.s === "done" ? "var(--positive)" : m.s === "active" ? "var(--accent)" : "var(--base)",
                    border: m.s === "queued" ? "1px solid var(--border-strong)" : "none",
                    color: m.s === "queued" ? "var(--text-muted)" : "#FAFAF7",
                    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                    boxShadow: m.s === "active" ? "0 0 0 3px rgba(232,83,14,0.12)" : "none",
                  }}>
                    {m.s === "done" ? "✓" : m.s === "active" ? "●" : String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="body" style={{ fontSize: 14, fontWeight: 500, color: m.s === "queued" ? "var(--text-muted)" : "var(--text)" }}>{m.t}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Center: live screenshot + streaming annotations ── */}
          <div>
            <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--base)", borderColor: "var(--border-strong)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#D93636", "#D4890A", "#2D8C4E"].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: 50, background: c, opacity: 0.5 }} />)}
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>brightskinclinic.com · landing</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)", animation: "blink 1.2s infinite" }} />
                  ANNOTATING
                </span>
              </div>
              <div style={{ position: "relative", padding: 24 }}>
                <PhImg label="Landing page · desktop · 1440w" aspect="unset" height={520} />
                {/* Annotations streaming in */}
                <span className="ann-pulse" style={{ left: "28%", top: "22%" }} />
                <span className="ann-pin pin-critical" style={{ left: "28%", top: "22%", position: "absolute" }}>1</span>
                <span className="ann-pin pin-warning" style={{ left: "62%", top: "35%", position: "absolute" }}>2</span>
                <span className="ann-pin pin-critical" style={{ left: "20%", top: "58%", position: "absolute" }}>3</span>
                <span className="ann-pulse" style={{ left: "75%", top: "72%" }} />
                <span className="ann-pin pin-warning" style={{ left: "75%", top: "72%", position: "absolute" }}>4</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
              {["landing.jpg", "capture-form.jpg", "instagram-bio.jpg"].map((src, i) => (
                <div key={src} className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 8, borderColor: "var(--border-strong)", height: 110, position: "relative" }}>
                  <PhImg label={src} aspect="unset" height={110} style={{ borderRadius: 0 }} />
                  <div style={{ position: "absolute", top: 8, left: 8 }} className="mono chip" style={{ fontSize: 9 }}>
                    {i === 0 ? "CURRENT" : i === 1 ? "QUEUED" : "QUEUED"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: live activity log ── */}
          <div className="card-ink" style={{ borderRadius: 12, padding: 20, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7, minHeight: 580, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Activity log</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent-bright)" }}>● LIVE</span>
            </div>
            {[
              ["00:02", "✓", "Resolved DNS · origin IP 54.231.x"],
              ["00:04", "✓", "Robots.txt OK · sitemap indexed"],
              ["00:08", "✓", "Captured 12 page snapshots"],
              ["00:12", "✓", "Mobile + tablet + desktop breakpoints"],
              ["00:18", "✓", "3 traffic channels detected"],
              ["00:24", "✓", "Meta pixel present · GA4 connected"],
              ["00:31", "✓", "Scored: traffic source mix (78/100)"],
              ["00:38", "●", "Landing vision pass · analyzing hero"],
              ["00:41", "·", "Cross-checking with benchmark db"],
              ["00:44", "·", "Pinning annotations to pixels"],
              ["00:47", "◌", "Queued: capture form analysis"],
            ].map(([t, s, msg], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 18px 1fr", gap: 4, color: i > 8 ? "var(--ink-text-2)" : "var(--ink-text)" }}>
                <span style={{ color: "var(--ink-text-2)" }}>{t}</span>
                <span style={{ color: s === "●" ? "var(--accent-bright)" : s === "✓" ? "var(--positive)" : "var(--ink-text-2)" }}>{s}</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice agent intro */}
        {voice && (
          <div style={{ maxWidth: 1320, margin: "32px auto 0" }}>
            <div className="card" style={{ padding: 22, display: "flex", gap: 20, alignItems: "center", borderColor: "var(--border-strong)", background: "var(--surface)" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, #1A1917 0%, #353533 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "var(--accent-bright)",
                border: "1px solid rgba(232,83,14,0.2)",
              }}>V</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                  <span className="display" style={{ fontSize: 16, fontWeight: 700 }}>Vega</span>
                  <span className="chip chip-accent">Voice agent</span>
                </div>
                <p className="body" style={{ fontSize: 14, color: "var(--text-2)", margin: 0, maxWidth: 640 }}>
                  Want me to walk you through the findings out loud when the scan wraps? I'll highlight the 3 biggest leaks first — you can interrupt any time.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm">Not now</button>
              <button className="btn btn-primary btn-sm">Yes, talk me through it</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SCAN IN PROGRESS — mobile
// ─────────────────────────────────────────────────────────────
const ScanMobile = () => (
  <div className="page" style={{ width: 375 }}>
    <MobileNav />
    <section style={{ padding: "28px 20px" }}>
      <Eyebrow accent>Scan in progress</Eyebrow>
      <h1 className="display-900" style={{ fontSize: 28, margin: "8px 0 0", lineHeight: 1.1 }}>
        Scanning <span style={{ color: "var(--accent)" }}>brightskinclinic.com</span>
      </h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>ELAPSED 00:47</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>ETA 01:30</span>
      </div>
      <div style={{ height: 3, background: "var(--card)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: "52%", height: "100%", background: "var(--accent)" }} />
      </div>

      <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden", borderColor: "var(--border-strong)" }}>
        <div style={{ padding: "10px 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-2)" }}>landing · desktop</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 50, background: "var(--accent)" }} /> ANNOTATING
          </span>
        </div>
        <div style={{ position: "relative", padding: 12 }}>
          <PhImg label="landing screenshot" aspect="unset" height={240} />
          <span className="ann-pulse" style={{ left: "28%", top: "25%" }} />
          <span className="ann-pin pin-critical" style={{ left: "28%", top: "25%", position: "absolute" }}>1</span>
          <span className="ann-pin pin-warning" style={{ left: "62%", top: "55%", position: "absolute" }}>2</span>
          <span className="ann-pin pin-critical" style={{ left: "30%", top: "78%", position: "absolute" }}>3</span>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Eyebrow>Milestones</Eyebrow>
        <div style={{ marginTop: 10 }}>
          {[
            ["Crawling site", "done"],
            ["Traffic sources", "done"],
            ["Landing experience", "active"],
            ["Lead capture", "queued"],
            ["Offer & conversion", "queued"],
            ["Follow-up", "queued"],
          ].map(([t, s], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto", alignItems: "center", padding: "12px 0", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: s === "done" ? "var(--positive)" : s === "active" ? "var(--accent)" : "var(--base)",
                border: s === "queued" ? "1px solid var(--border-strong)" : "none",
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: s === "queued" ? "var(--text-muted)" : "#FAFAF7",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{s === "done" ? "✓" : s === "active" ? "●" : "·"}</div>
              <span className="body" style={{ fontSize: 14, marginLeft: 10, color: s === "queued" ? "var(--text-muted)" : "var(--text)" }}>{t}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 24, display: "flex", gap: 12, alignItems: "center", background: "var(--surface)", borderColor: "var(--border-strong)" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #1A1917 0%, #353533 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, color: "var(--accent-bright)",
        }}>V</div>
        <div style={{ flex: 1 }}>
          <div className="body" style={{ fontSize: 13, fontWeight: 600 }}>Vega will walk you through it</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-2)", marginTop: 2 }}>TAP TO ENABLE VOICE</div>
        </div>
      </div>
    </section>
  </div>
);

Object.assign(window, { ScanDesktop, ScanMobile });

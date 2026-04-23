/* global React, TopNav, MobileNav, Footer, PhImg, Eyebrow, ForgeLogo */
const { useState: useStateL } = React;

// ─────────────────────────────────────────────────────────────
// LANDING — desktop 1440
// ─────────────────────────────────────────────────────────────
const LandingDesktop = ({ headline = "A" }) => (
  <div className="page" style={{ width: 1440 }}>
    <TopNav />

    {/* HERO */}
    <section style={{ position: "relative", padding: "100px 48px 120px", overflow: "hidden" }}>
      {/* watermark F */}
      <div aria-hidden style={{
        position: "absolute", right: -120, top: -80, fontFamily: "var(--font-display)", fontWeight: 900,
        fontSize: 520, lineHeight: 1, color: "rgba(26,25,23,0.035)", letterSpacing: "-0.04em", pointerEvents: "none",
      }}>F</div>
      {/* orange radial */}
      <div aria-hidden style={{
        position: "absolute", right: -200, top: -200, width: 800, height: 800,
        background: "radial-gradient(circle, rgba(232,83,14,0.08) 0%, transparent 60%)", pointerEvents: "none",
      }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 6, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Free revenue audit · v3.2
          </span>
        </div>
        <h1 className="display-900" style={{ fontSize: 88, margin: 0, maxWidth: 1040 }}>
          {headline === "A" ? (
            <>Your funnel is <span style={{ textDecoration: "line-through", textDecorationColor: "var(--text-muted)", textDecorationThickness: 3 }}>running</span><br />
              leaking revenue. <span style={{ color: "var(--accent)" }}>Let's find where.</span></>
          ) : (
            <>AI isn't magic. It's<br />infrastructure. <span style={{ color: "var(--accent)" }}>See what yours is missing.</span></>
          )}
        </h1>
        <p className="body" style={{ fontSize: 20, color: "var(--text-2)", marginTop: 32, maxWidth: 640, lineHeight: 1.55 }}>
          We scan your site, socials, and ads — then hand you a prosecutor's case on what's costing you customers. Real screenshots. Specific fixes. Dollar figures, not adjectives.
        </p>

        {/* URL input */}
        <div style={{ marginTop: 40, display: "flex", gap: 12, maxWidth: 640, alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 4px 0 20px", background: "#FFF", border: "1px solid var(--border-strong)", borderRadius: 10, height: 64, gap: 10 }}>
            <span className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>https://</span>
            <input placeholder="yourwebsite.com" defaultValue="brightskinclinic.com"
              style={{ flex: 1, border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 17, background: "transparent", color: "var(--text)" }} />
            <button className="btn btn-primary" style={{ height: 52, fontSize: 14 }}>Scan my funnel →</button>
          </div>
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 28 }}>
          {["Free, no card", "5 funnel stages", "~90s scan time", "For $500K–$5M service firms"].map((t, i) => (
            <span key={i} className="mono" style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>· {t}</span>
          ))}
        </div>

        {/* hero preview card */}
        <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "stretch" }}>
          <div className="card shadow-amb" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: "#D93636" }} />
                <span style={{ width: 8, height: 8, borderRadius: 50, background: "#D4890A" }} />
                <span style={{ width: 8, height: 8, borderRadius: 50, background: "#2D8C4E" }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>scanner.forgewith.ai · LIVE</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>● SCANNING</span>
            </div>
            <div style={{ position: "relative", height: 340, padding: 20 }}>
              <PhImg label="Landing screenshot · annotating" aspect="unset" height={300} />
              {/* pins */}
              <span className="ann-pin pin-critical" style={{ left: "22%", top: "30%", position: "absolute" }}>1</span>
              <span className="ann-pin pin-warning" style={{ left: "58%", top: "60%", position: "absolute" }}>2</span>
              <span className="ann-pin pin-opportunity" style={{ left: "80%", top: "25%", position: "absolute", background: "var(--opportunity)", boxShadow: "0 0 0 1px rgba(43,123,212,0.35), 0 8px 20px -6px rgba(43,123,212,0.6)" }}>3</span>
            </div>
          </div>
          {/* Side callout */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card-ink" style={{ borderRadius: 12, padding: 22 }}>
              <Eyebrow style={{ color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Biggest leak · est.</Eyebrow>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--accent-bright)" }}>$</span>
                <span className="display-900" style={{ fontSize: 58, color: "var(--ink-text)", letterSpacing: "-0.03em" }}>184,320</span>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-text-2)", marginTop: 6 }}>LEFT ON TABLE · NEXT 12 MONTHS</div>
              <div className="hair" style={{ background: "rgba(255,255,255,0.08)", margin: "18px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Lead capture", "Missing"], ["Speed-to-lead", "Weak"], ["Follow-up system", "Missing"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="body" style={{ fontSize: 13, color: "var(--ink-text)" }}>{k}</span>
                    <span className="mono" style={{ fontSize: 10, color: v === "Missing" ? "var(--critical)" : "var(--warning)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 20, background: "var(--surface)", borderColor: "var(--border-strong)" }}>
              <Eyebrow accent style={{ marginBottom: 10 }}>Contrarian take</Eyebrow>
              <p className="display" style={{ fontSize: 20, margin: 0, lineHeight: 1.3 }}>
                AI isn't magic. It's <span style={{ color: "var(--accent)" }}>infrastructure.</span> And infrastructure takes engineering, not prompts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* HOW IT WORKS — 4 stages */}
    <section style={{ background: "var(--surface)", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56 }}>
          <div>
            <Eyebrow accent>How it works</Eyebrow>
            <h2 className="display-900" style={{ fontSize: 56, margin: "12px 0 0", maxWidth: 640, lineHeight: 1.05 }}>
              Four stages. Ninety seconds. One verdict.
            </h2>
          </div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-2)", maxWidth: 320, textAlign: "right" }}>
            No config. Paste your URL. The rest happens on our servers.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, background: "var(--base)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
          {[
            { n: "01", t: "Crawl", d: "We open your site, ads, and socials. Headless browser grabs screenshots at 3 breakpoints." },
            { n: "02", t: "Analyze", d: "GPT-class vision models pin problems to pixels — against a 120-item Value Equation checklist." },
            { n: "03", t: "Cost it out", d: "Each leak translated to $ over 12 months using public benchmarks — 78% speed-to-lead, 5–7x follow-up, etc." },
            { n: "04", t: "Rebuild", d: "The weakest stage gets rebuilt on the spot. Not a recommendation — a working mockup." },
          ].map((s, i) => (
            <div key={s.n} style={{ padding: "36px 28px", borderRight: i < 3 ? "1px solid var(--border)" : "none", position: "relative" }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.14em" }}>{s.n}</span>
              <h3 className="display" style={{ fontSize: 28, margin: "20px 0 12px" }}>{s.t}</h3>
              <p className="body" style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* METHOD CARDS — Value Equation levers */}
    <section style={{ padding: "100px 48px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <Eyebrow accent>The four levers we test against</Eyebrow>
        <h2 className="display-900" style={{ fontSize: 48, margin: "12px 0 12px", maxWidth: 820, lineHeight: 1.08 }}>
          Every finding is tied to one of four things people actually decide on.
        </h2>
        <p className="body" style={{ fontSize: 16, color: "var(--text-2)", maxWidth: 680, marginTop: 0 }}>
          We use Hormozi's Value Equation as our audit framework. Dream Outcome × Perceived Likelihood, divided by Time Delay × Effort. If a finding doesn't move one of these, we don't report it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 48 }}>
          {[
            { l: "Dream Outcome", d: "Does the offer describe the actual end state they want?", c: "#2B7BD4" },
            { l: "Perceived Likelihood", d: "Do they believe it'll work — for them, not someone like them?", c: "#D4890A" },
            { l: "Time Delay", d: "How many days until they see the result?", c: "#E8530E" },
            { l: "Effort & Sacrifice", d: "What do they have to give up to say yes?", c: "#6B6860" },
          ].map((x, i) => (
            <div key={i} className="card" style={{ background: "var(--base)", borderColor: "var(--border-strong)", padding: 24, borderRadius: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: x.c, marginBottom: 18 }} />
              <h4 className="display" style={{ fontSize: 20, margin: "0 0 10px" }}>{x.l}</h4>
              <p className="body" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, margin: 0 }}>{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* SPLIT — sample finding */}
    <section style={{ background: "var(--ink)", color: "var(--ink-text)", padding: "100px 48px", position: "relative", overflow: "hidden" }}>
      <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 64, alignItems: "center" }}>
        <div>
          <Eyebrow style={{ color: "var(--ink-text-2)" }}>A sample finding</Eyebrow>
          <h2 className="display-900" style={{ fontSize: 54, margin: "14px 0 16px", lineHeight: 1.05 }}>
            Not "your hero is weak."<br /><span style={{ color: "var(--accent-bright)" }}>Here's the exact line, why it fails, and what it's costing.</span>
          </h2>
          <p className="body" style={{ fontSize: 16, color: "var(--ink-text-2)", lineHeight: 1.6, maxWidth: 420 }}>
            Generic audits say "improve your hero." We quote your hero back to you, mark which lever it breaks, and show the dollar delta — grounded in a public benchmark, not vibes.
          </p>
        </div>
        <div style={{ background: "var(--ink-card)", borderRadius: 12, padding: 32, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Finding 04 / 17 · Landing experience</span>
            <span className="chip chip-critical">Critical</span>
          </div>
          <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.03)", borderLeft: "3px solid var(--accent)", fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--ink-text)", lineHeight: 1.55, marginBottom: 20 }}>
            "Welcome to Bright Skin Clinic — where your journey to radiant skin begins."
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <Eyebrow style={{ color: "var(--ink-text-2)", marginBottom: 8 }}>Lever it breaks</Eyebrow>
              <span className="mono" style={{ fontSize: 12, color: "#6fb3ff", padding: "4px 8px", background: "rgba(43,123,212,0.12)", border: "1px solid rgba(43,123,212,0.3)", borderRadius: 4 }}>
                DREAM OUTCOME
              </span>
            </div>
            <div>
              <Eyebrow style={{ color: "var(--ink-text-2)", marginBottom: 8 }}>12-mo. cost</Eyebrow>
              <span className="mono" style={{ fontSize: 20, color: "var(--accent-bright)", fontWeight: 700 }}>$38k – $72k</span>
            </div>
          </div>
          <p className="body" style={{ fontSize: 14, color: "var(--ink-text-2)", lineHeight: 1.6, margin: 0 }}>
            Customers don't want "a journey." They want tighter pores by their friend's wedding on June 12. Lead with the dated, specific outcome. Hormozi's 8–15% conversion lift applies directly here.
          </p>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section style={{ padding: "100px 48px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Eyebrow accent>FAQ</Eyebrow>
        <h2 className="display-900" style={{ fontSize: 48, margin: "14px 0 56px" }}>Questions we get before you give us a URL.</h2>
        <div>
          {[
            { q: "Is this actually free, or do I get upsold halfway through?", a: "Free. You'll see your scan, findings, and a rebuilt mockup without paying. At the end, we pitch our build service — you can ignore it, screenshot the findings, and execute yourself." },
            { q: "Who's behind this? Who's actually reading my funnel?", a: "Adrián Carrera Moran (principal, ex-Shopify Plus). AI does the first pass, a human reviews before delivery. We don't ship findings neither of us would defend." },
            { q: "Do you store my site data?", a: "Screenshots for 30 days so you can reshare the findings. URL + email/phone kept for follow-up — unsubscribe removes both." },
            { q: "I already have an agency. Why would I run this?", a: "Good. Run it as a second opinion. The report is designed to be defensible — every finding cites the public benchmark we used." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "24px 0", borderBottom: i < 3 ? "1px solid var(--border-strong)" : "none", display: "grid", gridTemplateColumns: "40px 1fr", gap: 20 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--accent)", paddingTop: 4 }}>0{i + 1}</span>
              <div>
                <h4 className="display" style={{ fontSize: 20, margin: "0 0 10px" }}>{f.q}</h4>
                <p className="body" style={{ fontSize: 15, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FINAL CTA */}
    <section style={{ padding: "0 48px 80px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", background: "var(--ink)", borderRadius: 12, padding: "72px 56px", position: "relative", overflow: "hidden" }}>
        <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <h2 className="display-900" style={{ fontSize: 56, margin: 0, color: "var(--ink-text)", lineHeight: 1.05 }}>
              Want the diagnosis<br />or the surgery?
            </h2>
            <p className="body" style={{ fontSize: 18, color: "var(--ink-text-2)", marginTop: 20, maxWidth: 480 }}>
              The scan is free — that's the diagnosis. The rebuild is the surgery. Start with the first.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: 6, borderRadius: 10 }}>
            <input placeholder="yourwebsite.com" style={{ flex: 1, height: 52, padding: "0 16px", background: "transparent", border: "none", outline: "none", color: "var(--ink-text)", fontFamily: "var(--font-body)", fontSize: 15 }} />
            <button className="btn btn-primary">Scan →</button>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

// ─────────────────────────────────────────────────────────────
// LANDING — mobile 375
// ─────────────────────────────────────────────────────────────
const LandingMobile = ({ headline = "A" }) => (
  <div className="page" style={{ width: 375 }}>
    <MobileNav />
    <section style={{ position: "relative", padding: "48px 20px 40px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 5, marginBottom: 20 }}>
        <span style={{ width: 5, height: 5, borderRadius: 50, background: "var(--accent)" }} />
        <span className="mono" style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Free revenue audit</span>
      </div>
      <h1 className="display-900" style={{ fontSize: 42, margin: 0, lineHeight: 1.02 }}>
        {headline === "A" ? (
          <>Your funnel is leaking revenue.<br /><span style={{ color: "var(--accent)" }}>Let's find where.</span></>
        ) : (
          <>AI isn't magic. It's infrastructure.<br /><span style={{ color: "var(--accent)" }}>See what yours is missing.</span></>
        )}
      </h1>
      <p className="body" style={{ fontSize: 15, color: "var(--text-2)", marginTop: 20, lineHeight: 1.55 }}>
        Real screenshots. Specific fixes. Dollar figures, not adjectives.
      </p>
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 6px 0 14px", background: "#FFF", border: "1px solid var(--border-strong)", borderRadius: 10, height: 56 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>https://</span>
          <input placeholder="yourwebsite.com" defaultValue="brightskinclinic.com"
            style={{ flex: 1, border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 15, background: "transparent", marginLeft: 6 }} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", height: 52, marginTop: 10 }}>Scan my funnel →</button>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {["Free, no card required", "5 funnel stages analyzed", "Built for $500K–$5M service firms"].map((t, i) => (
          <span key={i} className="mono" style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>· {t}</span>
        ))}
      </div>
      {/* Preview card */}
      <div className="card-ink" style={{ borderRadius: 12, padding: 18, marginTop: 32 }}>
        <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>Biggest leak · est.</Eyebrow>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--accent-bright)" }}>$</span>
          <span className="display-900" style={{ fontSize: 40, color: "var(--ink-text)" }}>184,320</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", marginTop: 2 }}>LEFT ON TABLE · NEXT 12 MONTHS</div>
      </div>
    </section>
    <section style={{ background: "var(--surface)", padding: "48px 20px" }}>
      <Eyebrow accent>How it works</Eyebrow>
      <h2 className="display-900" style={{ fontSize: 32, margin: "10px 0 24px" }}>Four stages. Ninety seconds.</h2>
      {[
        { n: "01", t: "Crawl", d: "Headless browser grabs screenshots at 3 breakpoints." },
        { n: "02", t: "Analyze", d: "Vision AI pins problems to pixels vs. 120-item checklist." },
        { n: "03", t: "Cost it out", d: "Each leak translated to $ over 12 months." },
        { n: "04", t: "Rebuild", d: "The weakest stage gets rebuilt on the spot." },
      ].map((s) => (
        <div key={s.n} style={{ padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>{s.n}</span>
          <h3 className="display" style={{ fontSize: 22, margin: "8px 0 6px" }}>{s.t}</h3>
          <p className="body" style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>{s.d}</p>
        </div>
      ))}
    </section>
    <section style={{ padding: "48px 20px" }}>
      <Eyebrow accent>Contrarian take</Eyebrow>
      <p className="display" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 12 }}>
        AI isn't magic. It's <span style={{ color: "var(--accent)" }}>infrastructure.</span> And infrastructure takes engineering, not prompts.
      </p>
    </section>
    <section style={{ padding: "0 20px 40px" }}>
      <div style={{ background: "var(--ink)", borderRadius: 12, padding: 28, position: "relative", overflow: "hidden" }}>
        <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div style={{ position: "relative" }}>
          <h2 className="display-900" style={{ fontSize: 32, margin: 0, color: "var(--ink-text)", lineHeight: 1.1 }}>Diagnosis or surgery?</h2>
          <p className="body" style={{ fontSize: 14, color: "var(--ink-text-2)", marginTop: 12 }}>The scan is free. Start there.</p>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }}>Scan my funnel →</button>
        </div>
      </div>
    </section>
  </div>
);

Object.assign(window, { LandingDesktop, LandingMobile });

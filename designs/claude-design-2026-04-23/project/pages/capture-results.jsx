/* global React, TopNav, MobileNav, PhImg, Eyebrow, LeverBadge, StatusDot */

// ─────────────────────────────────────────────────────────────
// CAPTURE GATE
// ─────────────────────────────────────────────────────────────
const CaptureGate = ({ mobile = false }) => {
  const w = mobile ? 375 : 1440;
  const pad = mobile ? 20 : 48;
  return (
    <div className="page" style={{ width: w, background: "var(--base)" }}>
      {mobile ? <MobileNav /> : <TopNav compact />}
      <section style={{ padding: `${mobile ? 28 : 64}px ${pad}px`, position: "relative" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
          {/* Blurred content behind */}
          <div className="blur-gate" style={{ pointerEvents: "none" }}>
            <Eyebrow accent>Your audit is ready</Eyebrow>
            <h1 className="display-900" style={{ fontSize: mobile ? 32 : 56, margin: "12px 0 24px", lineHeight: 1.05 }}>
              17 findings across 5 stages.
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: 20, height: mobile ? 120 : 180, background: "var(--surface)" }}>
                  <div className="skel" style={{ width: "40%", height: 12, marginBottom: 10 }} />
                  <div className="skel" style={{ width: "80%", height: 18, marginBottom: 6 }} />
                  <div className="skel" style={{ width: "100%", height: 10, marginBottom: 6 }} />
                  <div className="skel" style={{ width: "60%", height: 10 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Modal */}
          <div style={{
            position: "absolute", top: mobile ? 20 : 40, left: "50%", transform: "translateX(-50%)",
            width: mobile ? "calc(100% - 20px)" : 520,
            background: "var(--base)", border: "1px solid var(--border-strong)", borderRadius: 12,
            padding: mobile ? 24 : 36, boxShadow: "0 1px 2px rgba(20,20,19,0.05), 0 30px 80px -20px rgba(20,20,19,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <Eyebrow accent>Last step</Eyebrow>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>00:47 / 01:30</span>
            </div>
            <h2 className="display-900" style={{ fontSize: mobile ? 26 : 32, margin: "0 0 14px", lineHeight: 1.1 }}>
              Where should we send the results?
            </h2>
            <p className="body" style={{ fontSize: 14.5, color: "var(--text-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
              We'll email a shareable link and a one-page PDF summary. The phone is for the optional voice walkthrough — not for sales calls.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="mono" style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 6 }}>Work email</label>
                <input className="input" type="email" placeholder="you@clinic.com" defaultValue="dr.kessler@brightskinclinic.com" />
              </div>
              <div>
                <label className="mono" style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 6 }}>Phone · optional</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="input" style={{ width: 84, flex: "none" }}>
                    <option>+1</option>
                  </select>
                  <input className="input" type="tel" placeholder="(555) 000-0000" />
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%", marginTop: 20, height: 52 }}>Send me the results →</button>
            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 14, height: 14, borderRadius: 2, border: "1.5px solid var(--border-strong)", marginTop: 1, flexShrink: 0 }} />
              <span className="body" style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
                Add me to the weekly teardown newsletter — one real business audited in public, every Thursday.
              </span>
            </div>
            <p className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 18, lineHeight: 1.6, letterSpacing: "0.04em" }}>
              No spam. No sales rotation. Unsubscribe deletes your data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────
const scoreData = [
  { stage: "Traffic sources", score: 62, severity: "Weak", key: "traffic" },
  { stage: "Landing experience", score: 41, severity: "Critical", key: "landing" },
  { stage: "Lead capture", score: 28, severity: "Critical", key: "capture" },
  { stage: "Offer & conversion", score: 22, severity: "Critical", key: "offer", weakest: true },
  { stage: "Follow-up system", score: 18, severity: "Critical", key: "followup" },
];

const StageScoreCard = ({ stage, score, severity, weakest }) => {
  const color = score >= 60 ? "var(--warning)" : "var(--critical)";
  return (
    <div className="card" style={{ padding: 22, borderColor: weakest ? "var(--accent)" : "var(--border-strong)", borderRadius: 10, position: "relative", background: weakest ? "#FFF" : "#FFF" }}>
      {weakest && <span className="chip chip-accent" style={{ position: "absolute", top: 16, right: 16 }}>Weakest</span>}
      <Eyebrow>{stage}</Eyebrow>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
        <span className="display-900" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>{score}</span>
        <span className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>/100</span>
      </div>
      <div className="score-bar" style={{ marginTop: 10 }}>
        <span style={{ width: `${score}%`, background: color }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{severity}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>→</span>
      </div>
    </div>
  );
};

const MoneyModelCard = () => {
  const layers = [
    { k: "Attraction", score: "weak", note: "Paid ads present. No lead magnet.", leak: "$48k" },
    { k: "Front-end cash", score: "weak", note: "One service, one price. No tripwire.", leak: "$72k" },
    { k: "Upsell / downsell", score: "missing", note: "No post-purchase path.", leak: "$164k", biggest: true },
    { k: "Continuity", score: "missing", note: "No membership, no retainer.", leak: "$38k" },
  ];
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--border-strong)", borderRadius: 12 }}>
      <div style={{ padding: "22px 24px", background: "var(--ink)", color: "var(--ink-text)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>Money Model · Hormozi 4-layer</Eyebrow>
            <h3 className="display-900" style={{ fontSize: 28, margin: "10px 0 0", lineHeight: 1.1 }}>You're running on one of four engines.</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Total leak · 12 mo</div>
            <div className="display-900" style={{ fontSize: 26, color: "var(--accent-bright)", marginTop: 4 }}>$322k</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {layers.map((l, i) => (
          <div key={l.k} style={{ padding: 22, borderRight: i < 3 ? "1px solid var(--border)" : "none", background: l.biggest ? "rgba(232,83,14,0.04)" : "var(--base)", position: "relative" }}>
            {l.biggest && (
              <div style={{ position: "absolute", top: -1, left: -1, right: -1, height: 3, background: "var(--accent)" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <StatusDot status={l.score} />
              <span className="mono" style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>0{i + 1}</span>
            </div>
            <h4 className="display" style={{ fontSize: 18, margin: "0 0 6px" }}>{l.k}</h4>
            <p className="body" style={{ fontSize: 13, color: "var(--text-2)", margin: "0 0 14px", lineHeight: 1.5 }}>{l.note}</p>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Leak</div>
            <div className="display-900" style={{ fontSize: 22, color: l.biggest ? "var(--accent)" : "var(--text)", marginTop: 2, letterSpacing: "-0.02em" }}>{l.leak}</div>
          </div>
        ))}
      </div>
      {/* Biggest leak callout */}
      <div style={{ padding: "18px 24px", background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", gap: 20, alignItems: "center" }}>
        <span className="chip chip-accent">Biggest leak</span>
        <p className="body" style={{ fontSize: 14, color: "var(--text)", margin: 0, flex: 1, lineHeight: 1.5 }}>
          You sell one $4,800 package and stop. A $297/month maintenance membership for 40% of buyers would close the gap in 9 months.
        </p>
      </div>
    </div>
  );
};

const VoiceAgentCard = () => (
  <div style={{ background: "var(--ink)", borderRadius: 12, padding: 28, color: "var(--ink-text)", position: "relative", overflow: "hidden" }}>
    <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
    <div style={{ position: "relative", display: "flex", gap: 24, alignItems: "center" }}>
      <div style={{
        width: 84, height: 84, borderRadius: 16, flexShrink: 0, position: "relative",
        background: "linear-gradient(135deg, #353533 0%, #1E1E1C 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, color: "var(--accent-bright)",
        border: "1px solid rgba(232,83,14,0.25)",
        boxShadow: "0 0 32px rgba(232,83,14,0.2)",
      }}>
        V
        <span style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: 50, background: "var(--positive)", border: "3px solid var(--ink)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <h3 className="display" style={{ fontSize: 22, margin: 0, color: "var(--ink-text)" }}>Vega</h3>
          <span className="chip chip-dark">Ready</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)" }}>~4 min walkthrough</span>
        </div>
        <p className="body" style={{ fontSize: 15, color: "var(--ink-text-2)", margin: 0, lineHeight: 1.55, maxWidth: 520 }}>
          "Hi Dr. Kessler. I read your scan. Before we talk fixes, let me show you the three findings I'd act on this week. Interrupt me any time."
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexDirection: "column", flexShrink: 0 }}>
        <button className="btn btn-primary" style={{ height: 48 }}>▶ Tap to hear Vega</button>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-text-2)" }}>or read it yourself</button>
      </div>
    </div>
  </div>
);

const StoryChapter = ({ num, stage, situation, lever, cost, fix, annotations = [] }) => (
  <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 24, paddingBottom: 40 }}>
    <div style={{ position: "relative" }}>
      <div className="stage-num">{num}</div>
      <div className="dotted-line-v" style={{ position: "absolute", left: 13, top: 36, bottom: -40 }} />
    </div>
    <div>
      <Eyebrow style={{ marginBottom: 4 }}>Chapter {num} · {stage}</Eyebrow>
      <h3 className="display-900" style={{ fontSize: 32, margin: "8px 0 20px", lineHeight: 1.1 }}>
        {situation.title}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Screenshot w/ pins */}
        <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--border-strong)" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-2)" }}>{situation.shot}</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{annotations.length} findings</span>
          </div>
          <div style={{ position: "relative", padding: 16 }}>
            <PhImg label={situation.shot} aspect="unset" height={280} />
            {annotations.map((a, i) => (
              <span key={i} className={"ann-pin pin-" + a.t} style={{ left: `${a.x}%`, top: `${a.y}%`, position: "absolute" }}>{i + 1}</span>
            ))}
          </div>
        </div>
        {/* Situation text */}
        <div>
          <Eyebrow>Situation</Eyebrow>
          <p className="body" style={{ fontSize: 15, color: "var(--text)", marginTop: 8, lineHeight: 1.6 }}>
            {situation.body}
          </p>
        </div>
      </div>

      {/* SCQA row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="card" style={{ padding: 20, background: "var(--surface)", borderColor: "var(--border-strong)" }}>
          <Eyebrow>Complication · lever broken</Eyebrow>
          <div style={{ marginTop: 12 }}><LeverBadge lever={lever.name} /></div>
          <p className="body" style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 12, lineHeight: 1.55 }}>{lever.body}</p>
        </div>
        <div className="card-ink" style={{ padding: 20, borderRadius: 10 }}>
          <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>So what · 12-mo cost</Eyebrow>
          <div className="display-900" style={{ fontSize: 32, color: "var(--accent-bright)", margin: "12px 0 4px" }}>{cost.range}</div>
          <p className="body" style={{ fontSize: 12, color: "var(--ink-text-2)", margin: 0, lineHeight: 1.5 }}>{cost.benchmark}</p>
        </div>
        <div className="card" style={{ padding: 20, background: "var(--base)", borderColor: "var(--accent)", borderRadius: 10 }}>
          <Eyebrow accent>Fix · specific</Eyebrow>
          <p className="body" style={{ fontSize: 14, color: "var(--text)", marginTop: 12, lineHeight: 1.55, fontWeight: 500 }}>{fix}</p>
        </div>
      </div>
    </div>
  </div>
);

const ResultsDesktop = ({ voice = true }) => (
  <div className="page" style={{ width: 1440 }}>
    <TopNav compact ctaLabel="Download PDF" />
    {/* Header */}
    <section style={{ padding: "36px 48px 24px", background: "var(--base)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <Eyebrow accent>Audit complete · scan #5f2a-91c0 · 94s</Eyebrow>
            <h1 className="display-900" style={{ fontSize: 56, margin: "12px 0 6px", lineHeight: 1.05 }}>
              We found <span style={{ color: "var(--accent)" }}>$322k</span> leaking<br />from brightskinclinic.com
            </h1>
            <p className="body" style={{ fontSize: 17, color: "var(--text-2)", margin: "16px 0 0", maxWidth: 680 }}>
              17 findings across 5 funnel stages. Each one tagged with the Value Equation lever it breaks, grounded in a public benchmark, and translated into a 12-month dollar range.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-secondary">Share link</button>
            <button className="btn btn-primary">Book strategy call →</button>
          </div>
        </div>
      </div>
    </section>

    {/* Voice agent prominent at top */}
    {voice && (
      <section style={{ padding: "16px 48px 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <VoiceAgentCard />
        </div>
      </section>
    )}

    {/* Per-stage score grid */}
    <section style={{ padding: "24px 48px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 className="display-900" style={{ fontSize: 28, margin: 0 }}>Per-stage scores</h2>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>tap any to jump to chapter</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {scoreData.map((s) => <StageScoreCard key={s.key} {...s} />)}
        </div>
      </div>
    </section>

    {/* Money Model overlay */}
    <section style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MoneyModelCard />
      </div>
    </section>

    {/* Story chapters */}
    <section style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Eyebrow accent>The prosecutor's case</Eyebrow>
          <h2 className="display-900" style={{ fontSize: 44, margin: "14px 0 10px", lineHeight: 1.05 }}>
            Five chapters. One verdict.
          </h2>
          <p className="body" style={{ fontSize: 16, color: "var(--text-2)", margin: 0, maxWidth: 640 }}>
            Situation → Complication → So what → Fix. Every chapter grounded in one thing you can verify.
          </p>
        </div>

        <StoryChapter
          num="01"
          stage="Landing experience · score 41"
          situation={{
            title: "Your hero sells a journey. Customers want a wedding.",
            shot: "brightskinclinic.com · above fold",
            body: "Current hero: \"Welcome to Bright Skin Clinic — where your journey to radiant skin begins.\" No dated outcome. No price anchor. No proof element above the fold. The CTA says \"Book consultation\" — another step, no commitment."
          }}
          annotations={[
            { t: "critical", x: 25, y: 28 },
            { t: "critical", x: 62, y: 40 },
            { t: "warning", x: 30, y: 78 },
          ]}
          lever={{
            name: "Dream Outcome",
            body: "The customer isn't buying radiance — she's buying tighter pores by her friend's wedding on June 12. Name the outcome. Date it."
          }}
          cost={{
            range: "$38k – $72k",
            benchmark: "Hormozi benchmark: 8–15% conversion lift from specific vs. generic hero. 2,400 monthly visitors × 2.8% baseline = $46k midpoint."
          }}
          fix={"Swap to: \u201CGlass-skin results by your next milestone \u2014 or your treatment is free.\u201D Add a before/after rotation and \u201CBook a free 20-minute skin plan\u201D as the CTA."}
        />

        <StoryChapter
          num="02"
          stage="Lead capture · score 28"
          situation={{
            title: "Your form has 11 fields. The industry average converts at 3.",
            shot: "brightskinclinic.com/book · desktop",
            body: "Name, email, phone, date of birth, address, skin type, concern, medications, referral source, preferred clinician, notes. A prospect at peak intent is asked to complete a medical intake before they've seen a price."
          }}
          annotations={[
            { t: "critical", x: 45, y: 35 },
            { t: "critical", x: 45, y: 68 },
          ]}
          lever={{
            name: "Effort & Sacrifice",
            body: "Every extra field compounds — the decision cost to convert doubles around field 5. Medical intake should happen AFTER the micro-yes, not before it."
          }}
          cost={{
            range: "$62k – $91k",
            benchmark: "Baymard: form abandonment jumps from 22% at 3 fields to 71% at 10+ fields. Applied to your 2,400 monthly visitors."
          }}
          fix="Collapse to 3 fields (name, email, phone). Move skin intake to a follow-up smartform emailed after the booking. Speed-to-lead target: 5 minutes."
        />

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <button className="btn btn-secondary">Show chapters 3 – 5 ↓</button>
        </div>
      </div>
    </section>

    {/* Give-Two-Pick-One */}
    <section style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="card" style={{ padding: 40, borderColor: "var(--border-strong)", background: "var(--surface)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow accent>Not ready to book yet?</Eyebrow>
            <h3 className="display-900" style={{ fontSize: 34, margin: "12px 0 8px" }}>Take something with you.</h3>
            <p className="body" style={{ fontSize: 15, color: "var(--text-2)", margin: 0 }}>Both are free. Pick the one you'd actually open.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              { t: "10-hour Forge Course", d: "Every build we'd make, explained in detail. Most agencies gatekeep this. We don't." },
              { t: "Weekly Teardown Newsletter", d: "One real business audited in public, every Thursday. You'll get last week's for free immediately." },
            ].map((x) => (
              <div key={x.t} className="card" style={{ background: "var(--base)", padding: 24, borderColor: "var(--border-strong)" }}>
                <h4 className="display" style={{ fontSize: 20, margin: "0 0 8px" }}>{x.t}</h4>
                <p className="body" style={{ fontSize: 13.5, color: "var(--text-2)", margin: "0 0 18px", lineHeight: 1.55 }}>{x.d}</p>
                <button className="btn btn-dark" style={{ width: "100%" }}>Send it to me</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section style={{ padding: "20px 48px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", background: "var(--ink)", borderRadius: 12, padding: "48px 40px", color: "var(--ink-text)", position: "relative", overflow: "hidden" }}>
        <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32 }}>
          <div>
            <h3 className="display-900" style={{ fontSize: 38, margin: 0, lineHeight: 1.05 }}>See the rebuilt offer page.</h3>
            <p className="body" style={{ fontSize: 15, color: "var(--ink-text-2)", margin: "10px 0 0" }}>We already drafted what your weakest stage should look like. Takes 30 seconds to view.</p>
          </div>
          <button className="btn btn-primary btn-lg">View the Blueprint →</button>
        </div>
      </div>
    </section>
  </div>
);

// Mobile results
const ResultsMobile = ({ voice = true }) => (
  <div className="page" style={{ width: 375 }}>
    <MobileNav />
    <section style={{ padding: "24px 20px" }}>
      <Eyebrow accent>Audit complete · 94s</Eyebrow>
      <h1 className="display-900" style={{ fontSize: 30, margin: "10px 0 10px", lineHeight: 1.1 }}>
        <span style={{ color: "var(--accent)" }}>$322k</span> leaking from your funnel
      </h1>
      <p className="body" style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>17 findings · 5 stages</p>

      {voice && (
        <div style={{ background: "var(--ink)", borderRadius: 12, padding: 18, color: "var(--ink-text)", marginTop: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #353533, #1E1E1C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "var(--accent-bright)",
            }}>V</div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>Vega</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)" }}>4 MIN WALKTHROUGH</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>▶ Tap to hear Vega</button>
        </div>
      )}

      {/* Score list (mobile: stack) */}
      <div style={{ marginTop: 24 }}>
        <Eyebrow>Per-stage scores</Eyebrow>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {scoreData.map((s) => (
            <div key={s.key} className="card" style={{ padding: 16, borderColor: s.weakest ? "var(--accent)" : "var(--border-strong)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <Eyebrow>{s.stage}</Eyebrow>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
                    <span className="display-900" style={{ fontSize: 28 }}>{s.score}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 10, color: s.score >= 60 ? "var(--warning)" : "var(--critical)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.severity}</span>
              </div>
              <div className="score-bar" style={{ marginTop: 10 }}><span style={{ width: `${s.score}%`, background: s.score >= 60 ? "var(--warning)" : "var(--critical)" }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Money Model compact */}
      <div style={{ marginTop: 32 }}>
        <Eyebrow accent>Money Model</Eyebrow>
        <h3 className="display-900" style={{ fontSize: 22, margin: "8px 0 14px", lineHeight: 1.15 }}>Biggest leak: no upsell path ($164k / yr)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Attraction", "weak", "$48k"],
            ["Front-end cash", "weak", "$72k"],
            ["Upsell/downsell", "missing", "$164k"],
            ["Continuity", "missing", "$38k"],
          ].map(([k, s, leak]) => (
            <div key={k} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: "var(--border-strong)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusDot status={s} />
                <span className="body" style={{ fontSize: 14, fontWeight: 500 }}>{k}</span>
              </div>
              <span className="display-900" style={{ fontSize: 18, color: s === "missing" ? "var(--accent)" : "var(--text)" }}>{leak}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Give-Two-Pick-One */}
      <div style={{ marginTop: 32, background: "var(--surface)", borderRadius: 12, padding: 20 }}>
        <Eyebrow accent>Not ready to book?</Eyebrow>
        <h3 className="display-900" style={{ fontSize: 20, margin: "8px 0 14px" }}>Take something free.</h3>
        <button className="btn btn-dark" style={{ width: "100%", marginBottom: 10 }}>10-hour Forge Course</button>
        <button className="btn btn-secondary" style={{ width: "100%" }}>Weekly Teardown Newsletter</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" style={{ width: "100%", height: 52 }}>View Blueprint →</button>
      </div>
    </section>
  </div>
);

Object.assign(window, { CaptureGate, ResultsDesktop, ResultsMobile });

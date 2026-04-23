/* global React, TopNav, MobileNav, PhImg, Eyebrow */

// ─────────────────────────────────────────────────────────────
// BLUEPRINT — Grand Slam offer mockup (Med Spa example)
// ─────────────────────────────────────────────────────────────
const BlueprintDesktop = () => (
  <div className="page" style={{ width: 1440 }}>
    <TopNav compact ctaLabel="Download PDF" />

    {/* Header */}
    <section style={{ padding: "40px 48px 28px", background: "var(--base)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <Eyebrow accent>Blueprint · the rebuild</Eyebrow>
            <h1 className="display-900" style={{ fontSize: 52, margin: "12px 0 10px", lineHeight: 1.05 }}>
              Your weakest stage was the <span style={{ color: "var(--accent)" }}>offer</span>.<br />
              Here's what it could look like.
            </h1>
            <p className="body" style={{ fontSize: 16, color: "var(--text-2)", margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
              Constructed against Hormozi's 5-step Grand Slam checklist. Every element tagged to the Value Equation lever it strengthens. Industry-specific — no Forge tiers in sight.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary">Print</button>
            <button className="btn btn-primary">Book strategy call →</button>
          </div>
        </div>
      </div>
    </section>

    {/* Construction checklist */}
    <section style={{ padding: "24px 48px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="card" style={{ padding: 24, background: "var(--surface)", borderColor: "var(--border-strong)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Eyebrow>Grand Slam construction · 5 steps</Eyebrow>
            <span className="mono" style={{ fontSize: 11, color: "var(--positive)" }}>✓ ALL PRESENT</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              ["MAGIC name", "Magnetic · Audience · Guarantee · Intrigue · Concrete"],
              ["30-word test", "Stated so a stranger understands in one read"],
              ["Value stack", "6 deliverables · $9,400 total value"],
              ["Anchor-first tiers", "Biggest price shown first — 3 tiers"],
              ["Risk reversal", "Outcome-based guarantee"],
            ].map(([t, d], i) => (
              <div key={i} style={{ padding: "14px 16px", background: "var(--base)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--positive)", color: "#FAFAF7", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)" }}>✓</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>0{i + 1}</span>
                </div>
                <div className="body" style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                <div className="body" style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.4 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* MOCKUP PAGE */}
    <section style={{ padding: "32px 48px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Mockup · brightskinclinic.com/glass-skin</span>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="chip">Desktop</span>
            <span className="chip chip-accent">Live preview</span>
          </div>
        </div>

        {/* Browser frame */}
        <div className="card shadow-amb" style={{ padding: 0, overflow: "hidden", borderRadius: 12, borderColor: "var(--border-strong)" }}>
          <div style={{ padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#D93636", "#D4890A", "#2D8C4E"].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: 50, background: c, opacity: 0.6 }} />)}
            </div>
            <div style={{ flex: 1, background: "var(--base)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
              brightskinclinic.com/glass-skin-by-summer
            </div>
          </div>

          {/* MOCKUP CONTENT — GRAND SLAM OFFER */}
          <div style={{ background: "#FFFEFB", padding: "56px 56px 40px" }}>
            {/* MAGIC name */}
            <div style={{ textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
              <div style={{ display: "inline-flex", gap: 8, marginBottom: 24 }}>
                <span className="chip chip-accent">LIMITED · SUMMER '26</span>
                <span className="chip">BUENOS AIRES · CDMX · MIAMI</span>
              </div>
              <h1 className="display-900" style={{ fontSize: 72, margin: "0 0 24px", lineHeight: 0.98, letterSpacing: "-0.03em" }}>
                Glass-Skin by Summer<span style={{ color: "var(--accent)" }}>™</span>
              </h1>
              <p className="body" style={{ fontSize: 20, color: "var(--text-2)", margin: "0 auto", maxWidth: 680, lineHeight: 1.5 }}>
                Five graduated treatments, a custom at-home routine, and an aesthetician on text — so you walk into June looking like you slept eight hours for a month. Or your next round is on us.
              </p>
            </div>

            {/* 30-word test */}
            <div style={{ maxWidth: 760, margin: "40px auto 0", padding: "16px 22px", background: "var(--surface)", borderRadius: 8, borderLeft: "3px solid var(--accent)" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>30-word test ·</span>
              <span className="body" style={{ fontSize: 14, color: "var(--text)", marginLeft: 10, lineHeight: 1.5 }}>
                Visible skin improvement in 12 weeks for women 32–52 in metro hubs — five in-clinic sessions, custom home protocol, text access to your aesthetician, or the next round is free.
              </span>
            </div>

            {/* Value stack */}
            <div style={{ maxWidth: 900, margin: "56px auto 0" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <Eyebrow accent>What's inside</Eyebrow>
                <h2 className="display-900" style={{ fontSize: 36, margin: "10px 0 0" }}>Six deliverables. Stacked.</h2>
              </div>
              <div style={{ background: "var(--base)", border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden" }}>
                {[
                  ["1", "Five graduated in-clinic treatments", "Hydrafacial → chem peel → LED → microneedling → hydro-finish. Sequenced, not bundled.", "$2,400"],
                  ["2", "Custom at-home morning + night protocol", "Built from a skin-mapping scan. Adjusted at week 4 and 8.", "$480"],
                  ["3", "Aesthetician on text (12 weeks)", "Same person who treats you. Replies within 4 business hours.", "$900"],
                  ["4", "Skin-progress photo journal", "Studio-light shots at week 0, 4, 8, 12. Shareable with your GP.", "$220"],
                  ["5", "Product starter kit (3 SKUs)", "Actually-dermo-grade. No clinic markup. Refills at cost.", "$380"],
                  ["6", "Wedding/event touch-up session", "One final polish the week before your milestone date.", "$320"],
                ].map(([n, t, d, v], i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr 120px", gap: 20, padding: "20px 24px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>0{n}</span>
                    <div>
                      <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{t}</div>
                      <div className="body" style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{d}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 600, textAlign: "right" }}>{v}</div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 120px", gap: 20, padding: "20px 24px", background: "var(--surface)", alignItems: "center" }}>
                  <span />
                  <span className="display" style={{ fontSize: 16, fontWeight: 700 }}>Total value</span>
                  <span className="display-900" style={{ fontSize: 24, textAlign: "right", textDecoration: "line-through", color: "var(--text-muted)" }}>$4,700</span>
                </div>
              </div>
            </div>

            {/* Goldilocks tiers — BIGGEST FIRST */}
            <div style={{ maxWidth: 1080, margin: "56px auto 0" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Eyebrow accent>Three ways in · biggest first</Eyebrow>
                <h2 className="display-900" style={{ fontSize: 36, margin: "10px 0 0" }}>Pick your tier.</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
                {[
                  { name: "Concierge", price: "6,800", desc: "Private treatment room. Night-and-weekend windows. Your aesthetician on a 2-hour reply SLA. Everything in the stack + a bi-weekly in-home check-in.", cta: "Book concierge", featured: true, includes: ["All 6 deliverables", "Private suite access", "2-hr text reply SLA", "In-home visits ×2", "Direct line to Dr. Kessler"] },
                  { name: "Full protocol", price: "3,200", desc: "The complete Glass-Skin by Summer program. Standard clinic hours. Shared text window with your aesthetician.", cta: "Book full protocol", includes: ["All 6 deliverables", "Standard hours", "4-hr reply window", "Group check-ins"] },
                  { name: "Starter", price: "1,400", desc: "Two treatments + home protocol + one text check-in. For people who want to test before committing.", cta: "Start starter", includes: ["Treatments 1 + 3", "Home protocol (8 wk)", "One check-in", "Upgrade credit 100%"] },
                ].map((t, i) => (
                  <div key={i} className="card" style={{
                    padding: 28,
                    background: t.featured ? "var(--ink)" : "var(--base)",
                    color: t.featured ? "var(--ink-text)" : "var(--text)",
                    borderColor: t.featured ? "var(--ink)" : "var(--border-strong)",
                    borderRadius: 10,
                    position: "relative", overflow: "hidden",
                  }}>
                    {t.featured && <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />}
                    <div style={{ position: "relative" }}>
                      {t.featured && <div className="chip chip-accent" style={{ marginBottom: 16 }}>Anchor · best value</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span className="display" style={{ fontSize: 20, fontWeight: 700 }}>{t.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                        <span className="mono" style={{ fontSize: 14, color: t.featured ? "var(--ink-text-2)" : "var(--text-2)" }}>$</span>
                        <span className="display-900" style={{ fontSize: 52, letterSpacing: "-0.03em", color: t.featured ? "var(--accent-bright)" : "var(--text)" }}>{t.price}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: t.featured ? "var(--ink-text-2)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>
                        one-time · 12-week program
                      </div>
                      <p className="body" style={{ fontSize: 13.5, color: t.featured ? "var(--ink-text-2)" : "var(--text-2)", lineHeight: 1.5, minHeight: 64, margin: 0 }}>{t.desc}</p>
                      <div className="hair" style={{ margin: "18px 0", background: t.featured ? "rgba(255,255,255,0.08)" : "var(--border)" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                        {t.includes.map((line, k) => (
                          <div key={k} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span className="mono" style={{ fontSize: 12, color: t.featured ? "var(--accent-bright)" : "var(--accent)" }}>+</span>
                            <span className="body" style={{ fontSize: 13, color: t.featured ? "var(--ink-text)" : "var(--text)" }}>{line}</span>
                          </div>
                        ))}
                      </div>
                      <button className={t.featured ? "btn btn-primary" : "btn btn-dark"} style={{ width: "100%" }}>{t.cta} →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk reversal + Social proof side by side */}
            <div style={{ maxWidth: 1080, margin: "40px auto 0", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 28, background: "var(--base)", border: "2px solid var(--accent)", borderRadius: 10 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--accent)", color: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>✓</div>
                  <div>
                    <Eyebrow accent>Outcome-based guarantee</Eyebrow>
                    <h4 className="display" style={{ fontSize: 22, margin: "8px 0 10px", lineHeight: 1.2 }}>See visible improvement in your week-12 photos, or your next round of treatments is on us.</h4>
                    <p className="body" style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>
                      Judged against your week-0 studio shots by a dermatologist unaffiliated with our clinic. Binary. Honest.
                    </p>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 28, background: "var(--surface)", borderColor: "var(--border-strong)", borderRadius: 10 }}>
                <Eyebrow>Real result · adjacent to price</Eyebrow>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10, marginBottom: 8 }}>
                  <span className="display-900" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>94%</span>
                  <span className="body" style={{ fontSize: 14, color: "var(--text-2)" }}>of full-protocol clients hit week-12 outcome</span>
                </div>
                <p className="body" style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  "Walked into my sister's wedding feeling like the version of me I thought I'd lost in my 30s. Worth every dollar." — Marisol G., full protocol June '25
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ maxWidth: 900, margin: "56px auto 0" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Eyebrow accent>Objections we hear</Eyebrow>
                <h3 className="display-900" style={{ fontSize: 30, margin: "10px 0 0" }}>The three things people ask before booking.</h3>
              </div>
              {[
                { q: "What if my skin reacts badly to the peel?", a: "Day-1 patch test happens before anything else. If anything's off, we pause and redesign — no clock on your 12 weeks, no charge for the pause." },
                { q: "Can I pause mid-program for vacation?", a: "Yes. Program is sequenced but flexible ±3 weeks. Your aesthetician adjusts the home routine for sun/altitude." },
                { q: "What happens after week 12?", a: "Optional $247/month maintenance membership: one monthly in-clinic, home refills at cost, text access continues. 40% of clients opt in. You don't have to." },
              ].map((f, i) => (
                <div key={i} style={{ padding: "20px 0", borderBottom: i < 2 ? "1px solid var(--border-strong)" : "none", display: "grid", gridTemplateColumns: "32px 1fr", gap: 16 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>0{i + 1}</span>
                  <div>
                    <h5 className="display" style={{ fontSize: 17, margin: "0 0 6px", fontWeight: 600 }}>{f.q}</h5>
                    <p className="body" style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Goodwill Playbook drop */}
    <section style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ background: "var(--ink)", borderRadius: 12, padding: "32px 36px", color: "var(--ink-text)", display: "flex", alignItems: "center", gap: 28, position: "relative", overflow: "hidden" }}>
          <div className="dot-grid-dark" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
          <div style={{ position: "relative", width: 96, height: 120, background: "var(--ink-card)", borderRadius: 6, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 14, flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="mono" style={{ fontSize: 9, color: "var(--accent-bright)" }}>FORGE</div>
            <div>
              <div className="display-900" style={{ fontSize: 14, lineHeight: 1.1, color: "var(--ink-text)" }}>Offer Construction Playbook</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--ink-text-2)", marginTop: 4 }}>v2.1 · PDF</div>
            </div>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>While you're here · free</Eyebrow>
            <h3 className="display-900" style={{ fontSize: 26, margin: "8px 0 6px", lineHeight: 1.1 }}>Grab the Forge Offer Construction Playbook.</h3>
            <p className="body" style={{ fontSize: 14, color: "var(--ink-text-2)", margin: 0 }}>
              38 pages on how we build Grand Slam offers. Already have your email — one click and it's in your inbox.
            </p>
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0 }}>Send me the PDF →</button>
        </div>
      </div>
    </section>

    {/* Primary CTA */}
    <section style={{ padding: "24px 48px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <Eyebrow accent>The diagnosis is free. This is the surgery.</Eyebrow>
        <h2 className="display-900" style={{ fontSize: 44, margin: "14px 0 16px", lineHeight: 1.05 }}>Want Forge to build yours?</h2>
        <p className="body" style={{ fontSize: 16, color: "var(--text-2)", margin: "0 auto 24px", maxWidth: 620 }}>30-minute strategy call with Adrián. If he can't ship a Grand Slam offer that makes sense for your business, you'll know inside the call.</p>
        <button className="btn btn-primary btn-lg">Book strategy call →</button>
      </div>
    </section>
  </div>
);

// ─────────────────────────────────────────────────────────────
// BLUEPRINT — mobile
// ─────────────────────────────────────────────────────────────
const BlueprintMobile = () => (
  <div className="page" style={{ width: 375 }}>
    <MobileNav />
    <section style={{ padding: "24px 20px" }}>
      <Eyebrow accent>Blueprint · the rebuild</Eyebrow>
      <h1 className="display-900" style={{ fontSize: 30, margin: "10px 0 12px", lineHeight: 1.08 }}>
        Your weakest stage was the <span style={{ color: "var(--accent)" }}>offer</span>. Here's the rebuild.
      </h1>

      {/* Mockup header */}
      <div className="card shadow-amb-sm" style={{ marginTop: 24, padding: 0, overflow: "hidden", borderColor: "var(--border-strong)", borderRadius: 10, background: "#FFFEFB" }}>
        <div style={{ padding: "8px 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-2)" }}>brightskinclinic.com/glass-skin</span>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <span className="chip chip-accent" style={{ fontSize: 9 }}>SUMMER '26</span>
          </div>
          <h2 className="display-900" style={{ fontSize: 34, margin: "0 0 12px", lineHeight: 0.98 }}>
            Glass-Skin by<br />Summer<span style={{ color: "var(--accent)" }}>™</span>
          </h2>
          <p className="body" style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
            Five graduated treatments, a custom at-home routine, and an aesthetician on text — so you walk into June looking like you slept eight hours for a month. Or your next round is on us.
          </p>

          {/* Value stack compact */}
          <div style={{ marginTop: 24, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {[
              ["5 in-clinic treatments", "$2,400"],
              ["Home protocol (12 wk)", "$480"],
              ["Aesthetician on text", "$900"],
              ["Photo journal", "$220"],
              ["Product starter kit", "$380"],
              ["Event touch-up", "$320"],
            ].map(([t, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
                <span className="body" style={{ fontSize: 13 }}>{t}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface)" }}>
              <span className="display" style={{ fontSize: 13, fontWeight: 700 }}>Total value</span>
              <span className="display-900" style={{ fontSize: 15, textDecoration: "line-through", color: "var(--text-muted)" }}>$4,700</span>
            </div>
          </div>

          {/* Tiers (stacked) */}
          <div style={{ marginTop: 24 }}>
            <Eyebrow accent>Three tiers · biggest first</Eyebrow>
            {[
              { n: "Concierge", p: "6,800", f: true },
              { n: "Full protocol", p: "3,200" },
              { n: "Starter", p: "1,400" },
            ].map((t, i) => (
              <div key={i} className="card" style={{ marginTop: 10, padding: 18, background: t.f ? "var(--ink)" : "var(--base)", color: t.f ? "var(--ink-text)" : "var(--text)", borderColor: t.f ? "var(--ink)" : "var(--border-strong)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    {t.f && <div className="chip chip-accent" style={{ marginBottom: 6 }}>ANCHOR</div>}
                    <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>{t.n}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    <span className="mono" style={{ fontSize: 12, color: t.f ? "var(--ink-text-2)" : "var(--text-2)" }}>$</span>
                    <span className="display-900" style={{ fontSize: 30, color: t.f ? "var(--accent-bright)" : "var(--text)" }}>{t.p}</span>
                  </div>
                </div>
                <button className={t.f ? "btn btn-primary" : "btn btn-dark"} style={{ width: "100%", marginTop: 14, height: 44 }}>Book {t.n.toLowerCase()} →</button>
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="card" style={{ marginTop: 20, padding: 18, border: "2px solid var(--accent)" }}>
            <Eyebrow accent>Guarantee</Eyebrow>
            <p className="display" style={{ fontSize: 16, margin: "8px 0 0", lineHeight: 1.3, fontWeight: 600 }}>
              Visible improvement by week 12, or your next round is on us.
            </p>
          </div>
        </div>
      </div>

      {/* Goodwill drop */}
      <div style={{ background: "var(--ink)", borderRadius: 12, padding: 20, color: "var(--ink-text)", marginTop: 24 }}>
        <Eyebrow style={{ color: "rgba(255,255,255,0.5)" }}>Free · while you're here</Eyebrow>
        <h3 className="display-900" style={{ fontSize: 20, margin: "8px 0 12px", lineHeight: 1.15 }}>Grab the Offer Construction Playbook.</h3>
        <button className="btn btn-primary" style={{ width: "100%" }}>Send me the PDF →</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" style={{ width: "100%", height: 52 }}>Book strategy call →</button>
      </div>
    </section>
  </div>
);

// ─────────────────────────────────────────────────────────────
// AI SALES AGENT CHAT
// ─────────────────────────────────────────────────────────────
const ChatDesktop = () => (
  <div className="page" style={{ width: 1440 }}>
    <TopNav compact />
    <section style={{ padding: "40px 48px", position: "relative", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 440px", gap: 32, minHeight: 700 }}>
        {/* Behind: results skeleton */}
        <div style={{ background: "var(--base)", borderRadius: 12, padding: 28, border: "1px solid var(--border-strong)" }}>
          <Eyebrow accent>Results · still open</Eyebrow>
          <h2 className="display-900" style={{ fontSize: 32, margin: "10px 0 20px", lineHeight: 1.1 }}>
            17 findings · $322k leak
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 14, borderColor: "var(--border)" }}>
                <div className="skel" style={{ width: "30%", height: 10, marginBottom: 8 }} />
                <div className="skel" style={{ width: "90%", height: 14, marginBottom: 6 }} />
                <div className="skel" style={{ width: "70%", height: 10 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel — slides in at 30s */}
        <div style={{ background: "var(--base)", border: "1px solid var(--border-strong)", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 2px rgba(20,20,19,0.04), 0 30px 80px -20px rgba(20,20,19,0.2)" }}>
          {/* Header */}
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, background: "var(--ink)", color: "var(--ink-text)" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: "linear-gradient(135deg, #353533, #1E1E1C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, color: "var(--accent-bright)",
              border: "1px solid rgba(232,83,14,0.25)",
              position: "relative",
            }}>V
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: 50, background: "var(--positive)", border: "2px solid var(--ink)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>Vega</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Read your scan · typing</div>
            </div>
            <button style={{ background: "transparent", border: "none", color: "var(--ink-text-2)", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", background: "var(--base)" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.14em" }}>Tue · 3:42 PM</div>

            {/* Vega messages */}
            {[
              "Hi Dr. Kessler. I'm Vega — I finished reading your audit about 30 seconds ago.",
              "Three things stood out. Want the one-minute version, or do you want me to walk chapter by chapter?",
            ].map((m, i) => (
              <div key={i} style={{ alignSelf: "flex-start", maxWidth: "86%", background: "var(--surface)", padding: "12px 14px", borderRadius: "12px 12px 12px 2px", fontSize: 14, lineHeight: 1.5 }}>
                {m}
              </div>
            ))}

            {/* User */}
            <div style={{ alignSelf: "flex-end", maxWidth: "86%", background: "var(--accent)", color: "#FAFAF7", padding: "12px 14px", borderRadius: "12px 12px 2px 12px", fontSize: 14, lineHeight: 1.5 }}>
              One-minute version. I'm between patients.
            </div>

            {[
              "Got it. Three leaks, in order:",
              "1. Your hero sells \"a journey.\" Customers are shopping for a wedding date. Rewriting the headline alone is worth $38–72k a year.",
              "2. Your intake form is 11 fields deep. Cutting to 3 and moving medical intake downstream recovers ~$62–91k.",
              "3. You have no post-treatment path. One $297/month membership at 40% attach closes a $164k gap.",
            ].map((m, i) => (
              <div key={"v" + i} style={{ alignSelf: "flex-start", maxWidth: "86%", background: "var(--surface)", padding: "12px 14px", borderRadius: "12px 12px 12px 2px", fontSize: 14, lineHeight: 1.5 }}>
                {m}
              </div>
            ))}

            {/* Give-two-pick-one fallback (msg 5+) */}
            <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "var(--ink)", color: "var(--ink-text)", padding: 16, borderRadius: "12px 12px 12px 2px", fontSize: 14, lineHeight: 1.5 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-text-2)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Your move</div>
              <div style={{ marginBottom: 12 }}>Pick what helps more right now:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-primary" style={{ justifyContent: "flex-start", height: 40 }}>📅 Book 30 min with Adrián</button>
                <button className="btn btn-dark" style={{ justifyContent: "flex-start", height: 40, background: "rgba(255,255,255,0.06)", color: "var(--ink-text)", border: "1px solid rgba(255,255,255,0.1)" }}>📘 Email me the Offer Playbook</button>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding: 14, borderTop: "1px solid var(--border)", background: "var(--base)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "8px 10px" }}>
              <input placeholder="Ask Vega anything about the audit…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 14, padding: "6px 4px" }} />
              <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 16 }}>🎙</button>
              <button className="btn btn-primary btn-sm" style={{ height: 36 }}>Send</button>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, textAlign: "center", letterSpacing: "0.08em" }}>
              Vega is an AI. Answers are sourced from your scan and the Forge library.
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const ChatMobile = () => (
  <div className="page" style={{ width: 375, background: "var(--base)", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: "var(--ink)", color: "var(--ink-text)" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: "linear-gradient(135deg, #353533, #1E1E1C)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, color: "var(--accent-bright)",
      }}>V</div>
      <div style={{ flex: 1 }}>
        <div className="display" style={{ fontSize: 14, fontWeight: 700 }}>Vega</div>
        <div className="mono" style={{ fontSize: 9, color: "var(--ink-text-2)", textTransform: "uppercase" }}>Read your scan</div>
      </div>
      <button style={{ background: "transparent", border: "none", color: "var(--ink-text-2)", fontSize: 16 }}>✕</button>
    </div>

    <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        { s: "v", m: "Hi Dr. Kessler. I'm Vega — finished reading your audit 30 seconds ago." },
        { s: "v", m: "Three things stood out. Want the one-minute version?" },
        { s: "u", m: "Yes. Between patients." },
        { s: "v", m: "Your hero sells \"a journey.\" Customers are shopping for a wedding date. Rewriting the headline alone is worth $38–72k a year." },
        { s: "v", m: "Your intake form is 11 fields. Cutting to 3 recovers ~$62–91k." },
      ].map((x, i) => (
        <div key={i} style={{
          alignSelf: x.s === "u" ? "flex-end" : "flex-start",
          maxWidth: "86%",
          background: x.s === "u" ? "var(--accent)" : "var(--surface)",
          color: x.s === "u" ? "#FAFAF7" : "var(--text)",
          padding: "10px 12px",
          borderRadius: x.s === "u" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          fontSize: 13.5, lineHeight: 1.5,
        }}>{x.m}</div>
      ))}

      <div style={{ alignSelf: "flex-start", width: "86%", background: "var(--ink)", color: "var(--ink-text)", padding: 14, borderRadius: "12px 12px 12px 2px" }}>
        <div className="mono" style={{ fontSize: 9, color: "var(--ink-text-2)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Your move</div>
        <button className="btn btn-primary" style={{ width: "100%", marginBottom: 6, height: 38 }}>📅 Book w/ Adrián</button>
        <button className="btn" style={{ width: "100%", height: 38, background: "rgba(255,255,255,0.06)", color: "var(--ink-text)", border: "1px solid rgba(255,255,255,0.1)" }}>📘 Email Offer Playbook</button>
      </div>
    </div>

    <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "6px 8px" }}>
        <input placeholder="Ask Vega…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, padding: "6px 4px" }} />
        <button style={{ background: "transparent", border: "none", color: "var(--text-2)" }}>🎙</button>
        <button className="btn btn-primary btn-sm" style={{ height: 32 }}>→</button>
      </div>
    </div>
  </div>
);

Object.assign(window, { BlueprintDesktop, BlueprintMobile, ChatDesktop, ChatMobile });

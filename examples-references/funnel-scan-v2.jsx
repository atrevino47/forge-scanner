import { useState, useRef, useEffect } from "react";

export default function FunnelScanV2() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState(0);
  // 0 = URL input (hero)
  // 1 = additional fields
  // 2 = scanning with live preview
  // 3 = complete
  const [bizName, setBizName] = useState("");
  const [displayUrl, setDisplayUrl] = useState("");
  const [scanSteps, setScanSteps] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLinePos, setScanLinePos] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const urlRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (urlRef.current && phase === 0) urlRef.current.focus();
  }, [phase]);

  // Normalize URL for display and iframe
  const normalizeUrl = (input) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = "https://" + u;
    return u;
  };

  // Scan line animation
  useEffect(() => {
    if (phase !== 2) return;
    let pos = 0;
    const interval = setInterval(() => {
      pos += 0.3;
      if (pos > 105) pos = -5;
      setScanLinePos(pos);
    }, 30);
    scanIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [phase]);

  // Scanning sequence
  useEffect(() => {
    if (phase !== 2) return;
    const steps = [
      { label: "Loading website...", delay: 500, progress: 5 },
      { label: "Capturing homepage screenshot...", delay: 2000, progress: 15 },
      { label: "Crawling internal links...", delay: 3500, progress: 25 },
      { label: "Analyzing page structure...", delay: 5000, progress: 35 },
      { label: "Scanning sales funnel flow...", delay: 6500, progress: 45 },
      { label: "Evaluating offer & pricing...", delay: 8000, progress: 55 },
      { label: "Checking call-to-action clarity...", delay: 9500, progress: 65 },
      { label: "Analyzing trust signals...", delay: 11000, progress: 75 },
      { label: "Reviewing ad library...", delay: 12500, progress: 85 },
      { label: "Generating visual annotations...", delay: 14000, progress: 92 },
    ];
    
    const timers = steps.map(step => 
      setTimeout(() => {
        setScanSteps(prev => [...prev, step.label]);
        setScanProgress(step.progress);
      }, step.delay)
    );

    // Annotations appear after "generating visual annotations"
    const annotationTimer = setTimeout(() => {
      setAnnotations([
        { x: 15, y: 8, w: 70, h: 8, label: "Hero headline lacks specific claim", type: "warning", delay: 0 },
        { x: 60, y: 22, w: 30, h: 5, label: "No clear CTA above fold", type: "error", delay: 300 },
        { x: 10, y: 45, w: 80, h: 12, label: "Social proof section is weak", type: "warning", delay: 600 },
        { x: 20, y: 72, w: 60, h: 8, label: "Missing guarantee / risk reversal", type: "error", delay: 900 },
        { x: 5, y: 88, w: 40, h: 6, label: "Footer has no secondary CTA", type: "info", delay: 1200 },
      ]);
    }, 15000);

    // Complete
    const completeTimer = setTimeout(() => {
      setScanProgress(100);
      clearInterval(scanIntervalRef.current);
      setPhase(3);
    }, 17500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(annotationTimer);
      clearTimeout(completeTimer);
    };
  }, [phase]);

  const handleUrlSubmit = () => {
    if (url.trim().length > 3) {
      setDisplayUrl(normalizeUrl(url));
      setPhase(1);
    }
  };

  const handleStartScan = () => {
    setPhase(2);
    setScanSteps([]);
    setScanProgress(0);
    setAnnotations([]);
    setIframeLoaded(false);
    setIframeError(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#F8FAFC",
    fontSize: "16px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: "none",
    transition: "all 200ms ease",
  };

  const labelStyle = {
    fontSize: "11px", fontWeight: 600, color: "#64748B",
    letterSpacing: "0.06em", textTransform: "uppercase",
    marginBottom: "8px", display: "block",
  };

  const typeColors = { error: "#EF4444", warning: "#F59E0B", info: "#60A5FA" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B1120",
      color: "#F8FAFC",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(212,165,55,0.4) !important; box-shadow: 0 0 0 3px rgba(212,165,55,0.08) !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(212,165,55,0.1); } 50% { box-shadow: 0 0 40px rgba(212,165,55,0.25); } }
        @keyframes annotationPop { 
          from { opacity: 0; transform: scale(0.9); } 
          to { opacity: 1; transform: scale(1); } 
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .slide-in { animation: slideIn 0.3s ease forwards; }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 0%, transparent 65%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(16px)", background: "rgba(11,17,32,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
          Forge<span style={{ color: "#D4A537" }}>Audit</span>
        </span>
        {phase >= 2 && (
          <div className="fade-in" style={{
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: phase === 3 ? "#22C55E" : "#D4A537",
              boxShadow: `0 0 8px ${phase === 3 ? "#22C55E" : "#D4A537"}`,
              animation: phase < 3 ? "pulseGlow 1.5s ease infinite" : "none",
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: phase === 3 ? "#22C55E" : "#D4A537",
            }}>
              {phase === 3 ? "SCAN COMPLETE" : "SCANNING..."}
            </span>
          </div>
        )}
      </header>

      {/* ============ PHASE 0-1: Input Form ============ */}
      {phase < 2 && (
        <main style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
          width: "100%", maxWidth: "520px", margin: "0 auto",
          padding: "0 24px",
          paddingTop: "min(22vh, 180px)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: phase === 0 ? "clamp(2.2rem, 4.5vw, 3.2rem)" : "clamp(1.6rem, 3vw, 2rem)",
              fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em",
              marginBottom: "14px",
              transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              Find What's <span style={{ color: "#D4A537" }}>Costing You</span> Sales
            </h1>
            <p style={{
              fontSize: phase === 0 ? "15px" : "14px",
              color: "#94A3B8", lineHeight: 1.6, maxWidth: "420px",
              transition: "all 400ms ease",
            }}>
              {phase === 0
                ? "We'll crawl your site, screenshot every page, and annotate exactly what to fix — for free."
                : "One more thing to personalize your scan."
              }
            </p>
          </div>

          <div style={{ width: "100%" }}>
            {/* URL */}
            <div style={{ marginBottom: "16px" }}>
              {phase === 0 && <span style={labelStyle}>Website URL</span>}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={urlRef}
                  type="url"
                  placeholder="yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  disabled={phase >= 1}
                  style={{
                    ...inputStyle, flex: 1,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "15px",
                    opacity: phase >= 1 ? 0.5 : 1,
                  }}
                />
                {phase === 0 && (
                  <button onClick={handleUrlSubmit} style={{
                    padding: "16px 28px",
                    background: url.trim().length > 3
                      ? "linear-gradient(135deg, #D4A537, #B8941F)"
                      : "rgba(255,255,255,0.06)",
                    color: url.trim().length > 3 ? "#0B1120" : "#64748B",
                    border: "none", borderRadius: "12px",
                    fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 200ms ease", whiteSpace: "nowrap",
                  }}>
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Business name */}
            {phase >= 1 && (
              <div className="fade-up">
                <span style={labelStyle}>Business name</span>
                <input
                  type="text" placeholder="Acme Design Co."
                  value={bizName} onChange={(e) => setBizName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && bizName.trim() && handleStartScan()}
                  autoFocus
                  style={{ ...inputStyle, marginBottom: "24px" }}
                />
                <button onClick={handleStartScan} style={{
                  width: "100%", padding: "18px",
                  background: "linear-gradient(135deg, #D4A537, #B8941F)",
                  color: "#0B1120", border: "none", borderRadius: "12px",
                  fontSize: "16px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 0 24px rgba(212,165,55,0.2)",
                }}>
                  Start Funnel Scan →
                </button>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#64748B", marginTop: "12px" }}>
                  Free · No signup · Visual annotations included
                </p>
              </div>
            )}
          </div>

          {/* Trust signals */}
          <div style={{
            marginTop: "48px", display: "flex", gap: "20px",
            opacity: phase === 0 ? 0.8 : 0.4, transition: "opacity 400ms",
          }}>
            {["2,847 scanned", "Free forever", "Visual annotations"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#D4A537" }} />
                <span style={{ fontSize: "11px", color: "#64748B" }}>{t}</span>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ============ PHASE 2-3: Scanning with Live Preview ============ */}
      {phase >= 2 && (
        <main className="fade-up" style={{
          position: "relative", zIndex: 1,
          display: "flex", gap: "24px",
          width: "100%", maxWidth: "1200px", margin: "0 auto",
          padding: "72px 24px 40px",
          minHeight: "100vh",
        }}>

          {/* LEFT: Live Website Preview */}
          <div style={{
            flex: "1 1 65%", display: "flex", flexDirection: "column",
          }}>
            {/* Browser chrome */}
            <div style={{
              background: "#1E293B",
              borderTopLeftRadius: "14px", borderTopRightRadius: "14px",
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
                  <div key={i} style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: c, opacity: 0.7,
                  }} />
                ))}
              </div>
              <div style={{
                flex: 1, padding: "6px 12px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "6px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px", color: "#94A3B8",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4 }}>
                  <circle cx="5" cy="5" r="4" stroke="#94A3B8" strokeWidth="1.2"/>
                  <path d="M8 8l3 3" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {displayUrl.replace("https://", "")}
              </div>
              {phase === 3 && (
                <div className="fade-in" style={{
                  padding: "3px 10px", borderRadius: "4px",
                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                  fontSize: "10px", fontWeight: 600, color: "#22C55E",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  DONE
                </div>
              )}
            </div>

            {/* Website preview area */}
            <div style={{
              position: "relative",
              flex: 1,
              minHeight: "500px",
              background: "#0F172A",
              borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "none",
            }}>
              {/* Iframe attempt */}
              <iframe
                src={displayUrl}
                title="Website preview"
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
                style={{
                  width: "100%", height: "100%",
                  border: "none",
                  position: "absolute", top: 0, left: 0,
                  opacity: iframeLoaded ? 1 : 0,
                  transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                  transform: "scale(0.75)",
                  transformOrigin: "top left",
                  width: "133.33%",
                  height: "133.33%",
                }}
                sandbox="allow-scripts allow-same-origin"
              />

              {/* Fallback if iframe blocked */}
              {!iframeLoaded && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: "12px",
                  background: "linear-gradient(180deg, #111827 0%, #0F172A 100%)",
                }}>
                  {/* Simulated website skeleton */}
                  <div style={{ width: "80%", maxWidth: "500px" }}>
                    {/* Nav skeleton */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                      <div style={{ width: "80px", height: "12px", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
                      <div style={{ display: "flex", gap: "12px" }}>
                        {[50, 40, 60].map((w, i) => (
                          <div key={i} style={{ width: `${w}px`, height: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "3px" }} />
                        ))}
                      </div>
                    </div>
                    {/* Hero skeleton */}
                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                      <div style={{ width: "70%", height: "18px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", margin: "0 auto 12px" }} />
                      <div style={{ width: "50%", height: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "4px", margin: "0 auto 24px" }} />
                      <div style={{ width: "120px", height: "36px", background: "rgba(212,165,55,0.1)", borderRadius: "8px", margin: "0 auto", border: "1px solid rgba(212,165,55,0.15)" }} />
                    </div>
                    {/* Content skeleton */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{
                          height: "80px", background: "rgba(255,255,255,0.03)",
                          borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)",
                        }} />
                      ))}
                    </div>
                    {/* More content */}
                    <div style={{ marginTop: "32px" }}>
                      <div style={{ width: "60%", height: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "12px" }} />
                      <div style={{ width: "90%", height: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "3px", marginBottom: "8px" }} />
                      <div style={{ width: "75%", height: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "3px" }} />
                    </div>
                  </div>
                  <p style={{
                    fontSize: "11px", color: "#475569",
                    fontFamily: "'JetBrains Mono', monospace",
                    position: "absolute", bottom: "12px",
                  }}>
                    {url}
                  </p>
                </div>
              )}

              {/* ===== SCAN LINE OVERLAY ===== */}
              {phase === 2 && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  pointerEvents: "none", zIndex: 10,
                }}>
                  {/* Scan line */}
                  <div style={{
                    position: "absolute",
                    left: 0, right: 0,
                    top: `${scanLinePos}%`,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent 0%, #D4A537 20%, #D4A537 80%, transparent 100%)",
                    boxShadow: "0 0 30px 8px rgba(212,165,55,0.15), 0 0 60px 16px rgba(212,165,55,0.06)",
                    transition: "top 30ms linear",
                  }} />
                  {/* Scanned area overlay (above the line) */}
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: `${Math.max(0, scanLinePos)}%`,
                    background: "rgba(212, 165, 55, 0.02)",
                    borderBottom: "none",
                    transition: "height 30ms linear",
                  }} />
                </div>
              )}

              {/* ===== ANNOTATIONS OVERLAY ===== */}
              {annotations.map((ann, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${ann.x}%`, top: `${ann.y}%`,
                    width: `${ann.w}%`, height: `${ann.h}%`,
                    border: `2px solid ${typeColors[ann.type]}`,
                    borderRadius: "6px",
                    background: `${typeColors[ann.type]}08`,
                    animation: `annotationPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    animationDelay: `${ann.delay}ms`,
                    opacity: 0,
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  {/* Label */}
                  <div style={{
                    position: "absolute",
                    top: "-28px", left: "0",
                    padding: "4px 10px",
                    background: typeColors[ann.type],
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#0B1120",
                    whiteSpace: "nowrap",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: `0 2px 12px ${typeColors[ann.type]}40`,
                  }}>
                    {ann.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Scan Progress Panel */}
          <div style={{
            flex: "0 0 300px",
            display: "flex", flexDirection: "column", gap: "20px",
            paddingTop: "8px",
          }}>
            {/* Scan info card */}
            <div style={{
              padding: "20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 600, color: "#64748B",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Scanning
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px", color: "#F8FAFC", marginBottom: "4px",
                wordBreak: "break-all",
              }}>
                {url}
              </div>
              {bizName && (
                <div style={{ fontSize: "12px", color: "#64748B" }}>{bizName}</div>
              )}

              {/* Progress bar */}
              <div style={{
                marginTop: "16px",
                height: "3px", background: "rgba(255,255,255,0.06)",
                borderRadius: "2px", overflow: "hidden",
              }}>
                <div style={{
                  width: `${scanProgress}%`, height: "100%",
                  background: "linear-gradient(90deg, #D4A537, #F0D078)",
                  borderRadius: "2px",
                  transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
              </div>
              <div style={{
                marginTop: "8px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#64748B",
                textAlign: "right",
              }}>
                {scanProgress}%
              </div>
            </div>

            {/* Scan steps log */}
            <div style={{
              padding: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              flex: 1,
              overflow: "auto",
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 600, color: "#64748B",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Activity Log
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {scanSteps.map((step, i) => (
                  <div
                    key={i}
                    className="slide-in"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "8px",
                    }}
                  >
                    {i < scanSteps.length - 1 || phase === 3 ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: "2px", flexShrink: 0 }}>
                        <path d="M3 6l2 2 4-4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div style={{
                        width: "12px", height: "12px", marginTop: "2px", flexShrink: 0,
                        borderRadius: "50%",
                        border: "2px solid #D4A537",
                        borderTopColor: "transparent",
                        animation: "spin 0.7s linear infinite",
                      }} />
                    )}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px", lineHeight: 1.4,
                      color: i === scanSteps.length - 1 && phase !== 3 ? "#D4A537" : "#94A3B8",
                    }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results summary — appears when done */}
            {phase === 3 && (
              <div className="fade-up" style={{
                padding: "20px",
                background: "rgba(212,165,55,0.04)",
                border: "1px solid rgba(212,165,55,0.15)",
                borderRadius: "14px",
              }}>
                <div style={{
                  fontSize: "28px", fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#F8FAFC", marginBottom: "4px",
                }}>
                  23 <span style={{ fontSize: "14px", fontWeight: 400, color: "#94A3B8" }}>issues found</span>
                </div>
                <div style={{
                  display: "flex", gap: "12px", marginBottom: "16px",
                }}>
                  <span style={{ fontSize: "12px", color: "#EF4444" }}>● 8 critical</span>
                  <span style={{ fontSize: "12px", color: "#F59E0B" }}>● 11 warnings</span>
                  <span style={{ fontSize: "12px", color: "#60A5FA" }}>● 4 tips</span>
                </div>
                <button style={{
                  width: "100%", padding: "14px",
                  background: "linear-gradient(135deg, #D4A537, #B8941F)",
                  color: "#0B1120", border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  View Full Report →
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

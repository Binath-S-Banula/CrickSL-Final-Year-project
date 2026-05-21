import { useNavigate } from "react-router-dom";

const MODULES = [
  {
    icon: "🏟️",
    title: "Venue & Weather Analysis",
    desc: "Opponent-adjusted par scores, phase-by-phase scoring patterns, dew risk, rain probability, swing conditions and toss recommendations based on real weather data.",
    badges: ["Par Score", "Dew Risk", "Toss Advice", "Live Weather"],
    badgeClass: "badge-blue",
    border: "rgba(59,130,246,0.35)",
    path: "/venue-weather",
  },
  {
    icon: "👥",
    title: "Playing XI Recommendation",
    desc: "MCDA-based player ranking using venue performance, recent form and opponent matchup analysis. Recommends optimal XI from active squad with suitability scores.",
    badges: ["MCDA", "Matchup Analysis", "Active Filter"],
    badgeClass: "badge-medium",
    border: "rgba(245,158,11,0.35)",
    path: "/playing-xi",
  },
  {
    icon: "🌧️",
    title: "DLS Rain Calculator",
    desc: "Pre-match DLS analysis using ICC Standard Edition resource table. 5-over milestone breakdown with required run rates across multiple wicket scenarios.",
    badges: ["DLS Standard", "5-Over Table", "Strategy"],
    badgeClass: "badge-low",
    border: "rgba(16,185,129,0.35)",
    path: "/dls",
  },
  {
    icon: "📊",
    title: "Pre-Match Reports",
    desc: "Comprehensive match preparation reports with phase scoring charts, bat-first vs chase analysis, top SL player stats at the venue and printable PDF export.",
    badges: ["Phase Charts", "Player Stats", "PDF Export"],
    badgeClass: "badge-blue",
    border: "rgba(59,130,246,0.35)",
    path: "/reports",
  },
  {
    icon: "🏏",
    title: "Player Analytics Dashboard",
    desc: "Individual player performance analysis with dismissal breakdowns, scoring distribution, phase vulnerabilities and fault analysis for batters and bowlers.",
    badges: ["Fault Analysis", "Dismissal Breakdown", "Phase Stats"],
    badgeClass: "badge-medium",
    border: "rgba(139,92,246,0.35)",
    path: "/players",
  },
];

// Decorative background icons — position, size, opacity
const BG_ICONS = [
  { icon: "🏏", top: "8%",  left: "3%",  size: "7rem",  opacity: 0.07, rotate: "-20deg" },
  { icon: "🏆", top: "5%",  left: "82%", size: "8rem",  opacity: 0.07, rotate: "15deg"  },
  { icon: "🏟️", top: "55%", left: "1%",  size: "6rem",  opacity: 0.06, rotate: "10deg"  },
  { icon: "🌧️", top: "60%", left: "88%", size: "6rem",  opacity: 0.06, rotate: "-10deg" },
  { icon: "👥", top: "30%", left: "90%", size: "5rem",  opacity: 0.05, rotate: "20deg"  },
  { icon: "📊", top: "75%", left: "6%",  size: "5rem",  opacity: 0.05, rotate: "-15deg" },
  { icon: "⚡", top: "20%", left: "8%",  size: "4rem",  opacity: 0.06, rotate: "30deg"  },
  { icon: "🎯", top: "78%", left: "80%", size: "4.5rem",opacity: 0.06, rotate: "-25deg" },
  { icon: "🏏", top: "45%", left: "94%", size: "3.5rem",opacity: 0.04, rotate: "45deg"  },
  { icon: "🌟", top: "88%", left: "45%", size: "3rem",  opacity: 0.05, rotate: "0deg"   },
  { icon: "🎽", top: "12%", left: "50%", size: "3rem",  opacity: 0.04, rotate: "15deg"  },
  { icon: "🏆", top: "50%", left: "50%", size: "12rem", opacity: 0.03, rotate: "0deg"   },
]

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0a0f1e 0%, #0f1f3d 40%, #0d1a2e 70%, #0a0f1e 100%)",
        borderBottom: "1px solid rgba(59,130,246,0.25)",
        padding: "6rem 2rem 5rem",
        textAlign: "center",
      }}>

        {/* Decorative background icons */}
        {BG_ICONS.map((d, i) => (
          <div key={i} style={{
            position: "absolute",
            top: d.top,
            left: d.left,
            fontSize: d.size,
            opacity: d.opacity,
            transform: `rotate(${d.rotate})`,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
            filter: "grayscale(30%)",
          }}>
            {d.icon}
          </div>
        ))}

        {/* Subtle radial glow behind title */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px", height: "72px",
            background: "rgba(245,158,11,0.15)",
            border: "2px solid rgba(245,158,11,0.4)",
            borderRadius: "50%",
            fontSize: "2rem",
            marginBottom: "1.5rem",
          }}>
            🏏
          </div>

          <h1 style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(3rem, 7vw, 5rem)",
            fontWeight: 800,
            marginBottom: "0.5rem",
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}>
            Crick<span style={{ color: "#f59e0b" }}>SL</span>
          </h1>

          <p style={{
            fontSize: "1.2rem",
            color: "#93c5fd",
            maxWidth: "580px",
            margin: "0 auto 0.75rem",
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            T20 Cricket Analytics &amp; Decision Support System for Sri Lanka
          </p>

          <p style={{
            fontSize: "0.87rem",
            color: "rgba(148,197,253,0.6)",
            marginBottom: "3rem",
            letterSpacing: "0.02em",
          }}>
            Powered by 4,991 matches · 1.1M deliveries · Random Forest ML @ 72.7%
          </p>

          {/* Stats row */}
          <div style={{
            display: "inline-flex",
            gap: "0",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "0.75rem 0",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {[
              { value: "4,991",  label: "T20 Matches" },
              { value: "1.1M",   label: "Deliveries" },
              { value: "72.7%",  label: "ML Accuracy" },
              { value: "5",      label: "Modules" },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: "0.5rem 2rem",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                textAlign: "center",
              }}>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.6rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(148,197,253,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-gold"
              style={{ fontSize: "1rem", padding: "0.85rem 2.25rem", borderRadius: "10px", fontWeight: 700 }}
              onClick={() => navigate("/venue-weather")}
            >
              🏟️ Start Analysis
            </button>
            <button
              className="btn btn-outline"
              style={{ fontSize: "1rem", padding: "0.85rem 2.25rem", borderRadius: "10px", fontWeight: 600 }}
              onClick={() => navigate("/playing-xi")}
            >
              👥 Select Playing XI
            </button>
          </div>
        </div>
      </div>

      {/* ── Modules Section ───────────────────────────────────── */}
      <div style={{ padding: "4rem 2rem", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}>
            Five Analytics Modules
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Data-driven decision support for every aspect of match preparation
          </p>
        </div>

        {/* Top row — 3 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {MODULES.slice(0, 3).map((m) => (
            <ModuleCard key={m.path} m={m} navigate={navigate} />
          ))}
        </div>

        {/* Bottom row — 2 cards centered */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
          {MODULES.slice(3).map((m) => (
            <ModuleCard key={m.path} m={m} navigate={navigate} />
          ))}
        </div>
      </div>

    </div>
  );
}

function ModuleCard({ m, navigate }) {
  return (
    <div
      className="card"
      style={{ cursor: "pointer", borderColor: m.border, transition: "transform 0.2s, box-shadow 0.2s" }}
      onClick={() => navigate(m.path)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${m.border}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>{m.icon}</div>
      <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-primary)" }}>
        {m.title}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "1rem" }}>
        {m.desc}
      </p>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {m.badges.map((b) => (
          <span key={b} className={`badge ${m.badgeClass}`}>{b}</span>
        ))}
      </div>
    </div>
  );
}

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

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏏</div>
        <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
          Crick<span style={{ color: "#f59e0b" }}>SL</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 0.6rem", lineHeight: 1.6 }}>
          T20 Cricket Analytics &amp; Decision Support System for Sri Lanka
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2.5rem" }}>
          Powered by 4,991 matches · 1.1M deliveries · Random Forest ML @ 72.7%
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-gold" style={{ fontSize: "1rem", padding: "0.8rem 2rem" }} onClick={() => navigate("/venue-weather")}>
            🏟️ Start Analysis
          </button>
          <button className="btn btn-outline" style={{ fontSize: "1rem", padding: "0.8rem 2rem" }} onClick={() => navigate("/playing-xi")}>
            👥 Select Playing XI
          </button>
        </div>
      </div>

      {/* ── Modules Section ───────────────────────────────────── */}
      <div style={{ padding: "4rem 2rem", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
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
      style={{ cursor: "pointer", borderColor: m.border, transition: "transform 0.15s, box-shadow 0.15s" }}
      onClick={() => navigate(m.path)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${m.border}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>{m.icon}</div>
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

import { useNavigate } from "react-router-dom";
import "./Footer.css";

const MODULES = [
  { icon: "🏟️", label: "Venue & Weather Analysis", path: "/venue-weather" },
  { icon: "👥", label: "Playing XI Recommendation", path: "/playing-xi" },
  { icon: "🌧️", label: "DLS Rain Calculator", path: "/dls" },
  { icon: "📊", label: "Pre-Match Reports", path: "/reports" },
  { icon: "🏏", label: "Player Analytics", path: "/players" },
];

const SYSTEM_STATS = [
  { label: "Dataset", value: "Cricsheet T20I" },
  { label: "Matches", value: "4,991" },
  { label: "Deliveries", value: "1.1M" },
  { label: "ML Model", value: "Random Forest" },
  { label: "Accuracy", value: "72.7%" },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* ── Top Grid ──────────────────────────────────────── */}
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand-logo">
              🏏 Crick<span className="accent">SL</span>
            </div>
            <p className="footer-brand-desc">
              A data-driven T20 cricket decision support system for Sri Lanka
              Cricket. Built on 4,991 matches and 1.1 million ball-by-ball
              delivery records using machine learning and statistical analytics.
            </p>
          </div>

          {/* Modules */}
          <div>
            <div className="footer-col-title">Modules</div>
            {MODULES.map((m) => (
              <button
                key={m.path}
                className="footer-link"
                onClick={() => navigate(m.path)}
              >
                <span className="footer-link-icon">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Dataset Info */}
          <div>
            <div className="footer-col-title">Dataset</div>
            {SYSTEM_STATS.map((s) => (
              <div key={s.label} className="footer-stat-row">
                <span className="footer-stat-label">{s.label}</span>
                <span className="footer-stat-value">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Project Info */}
          <div>
            <div className="footer-col-title">Project</div>
            {[
              { label: "Module", value: "PUSL3190" },
              { label: "Type", value: "Computing Project" },
              { label: "Backend", value: "FastAPI" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Frontend", value: "React + Vite" },
              { label: "Pipeline", value: "GitHub Actions" },
            ].map((s) => (
              <div key={s.label} className="footer-stat-row">
                <span className="footer-stat-label">{s.label}</span>
                <span className="footer-stat-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="footer-divider" />

        {/* ── Bottom Bar ────────────────────────────────────── */}
        <div className="footer-bottom">
          <div className="footer-copy">
            <span>© {new Date().getFullYear()} CrickSL</span>
            <span className="dot">·</span>
            <span>All rights reserved</span>
            <span className="dot">·</span>
            <span>Sri Lanka Cricket Analytics Platform</span>
          </div>

          <div className="footer-right">
            <div className="footer-flag">🇱🇰 Built for Sri Lanka Cricket</div>
            <div className="footer-status">
              <div className="footer-status-dot" />
              System Online
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

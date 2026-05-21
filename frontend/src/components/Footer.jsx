import { useNavigate } from 'react-router-dom'
import './Footer.css'

const QUICK_LINKS = [
  { label: 'Home',                  path: '/' },
  { label: 'Venue & Weather',       path: '/venue-weather' },
  { label: 'Playing XI',            path: '/playing-xi' },
  { label: 'DLS Calculator',        path: '/dls' },
  { label: 'Pre-Match Reports',     path: '/reports' },
  { label: 'Player Analytics',      path: '/players' },
]

const SOCIAL = [
  {
    name: 'WhatsApp',
    url: 'https://wa.me/',
    color: '#25D366',
    bg: 'rgba(37,211,102,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com',
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com',
    color: '#E4405F',
    bg: 'rgba(228,64,95,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529"/>
            <stop offset="50%" stopColor="#DD2A7B"/>
            <stop offset="100%" stopColor="#8134AF"/>
          </linearGradient>
        </defs>
        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    name: 'X',
    url: 'https://x.com',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.12)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ── Top Grid ──────────────────────────────────────── */}
        <div className="footer-grid">

          {/* Column 1 — Brand + contact */}
          <div className="footer-col-brand">
            <div className="footer-brand-logo">
              🏏 Crick<span className="accent">SL</span>
            </div>
            <p className="footer-brand-desc">
              A data-driven T20 cricket analytics and decision support system
              for Sri Lanka Cricket. Built on ball-by-ball historical data using
              machine learning and statistical analysis.
            </p>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <span>+94 12 345 6789</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-icon">✉️</span>
                <span>cricksl@gmail.com</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📍</span>
                <span>CrickSL, Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div className="footer-col">
            <div className="footer-col-title">Quick Links</div>
            {QUICK_LINKS.map(m => (
              <button key={m.path} className="footer-link" onClick={() => navigate(m.path)}>
                <span className="footer-arrow">→</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Column 3 — Project Info */}
          <div className="footer-col">
            <div className="footer-col-title">Project Info</div>
            <div className="footer-info-sub">Dataset</div>
            {[
              ['Source',     'Cricsheet.org'],
              ['Matches',    '4,991 T20I'],
              ['Deliveries', '1,148,372'],
              ['ML Model',   'Random Forest'],
              ['Accuracy',   '72.7%'],
            ].map(([k, v]) => (
              <div key={k} className="footer-stat-row">
                <span className="footer-stat-label">{k}</span>
                <span className="footer-stat-value">{v}</span>
              </div>
            ))}
          </div>

          {/* Column 4 — Stay Connected */}
          <div className="footer-col">
            <div className="footer-col-title">Stay Connected</div>
            <p className="footer-social-desc">
              Follow us for cricket analytics updates and insights.
            </p>
            <div className="footer-social-grid">
              {SOCIAL.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-social-btn"
                  title={s.name}
                  style={{ '--social-color': s.color, '--social-bg': s.bg }}
                >
                  {s.icon}
                  <span className="footer-social-label" style={{ color: s.color }}>
                    {s.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="footer-divider" />

        {/* ── Bottom Bar ────────────────────────────────────── */}
        <div className="footer-bottom">
          <div className="footer-copy">
            <span>© {new Date().getFullYear()} CrickSL. All rights reserved.</span>
            <span className="dot">·</span>
            <span>Made with 🇱🇰 for Sri Lanka Cricket</span>
          </div>
          <div className="footer-right">
            <div className="footer-status">
              <div className="footer-status-dot" />
              System Online
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

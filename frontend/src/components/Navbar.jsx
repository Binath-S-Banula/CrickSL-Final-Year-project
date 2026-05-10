import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const navItems = [
  { to: '/venue-weather', label: 'Venue & Weather', icon: '🏟' },
  { to: '/playing-xi',    label: 'Playing XI',      icon: '👥' },
  { to: '/dls',           label: 'DLS Calculator',  icon: '🌧' },
  { to: '/reports',       label: 'Reports',         icon: '📊' },
  { to: '/players',       label: 'Players',         icon: '🏏' },
]

const ROLE_COLORS = {
  admin:   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  analyst: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  coach:   { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
  player:  { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.analyst

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[parts.length-1][0].toUpperCase()
      : name[0].toUpperCase()
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <NavLink to="/" className="navbar-brand">
          <img src="/cricksl-favicon.png" alt="CrickSL"
            style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
          <span className="brand-text">Crick<span className="brand-accent">SL</span></span>
        </NavLink>

        <ul className="navbar-links">
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>{icon}</span> {label}
              </NavLink>
            </li>
          ))}
          {isAdmin() && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>⚙</span> Admin
              </NavLink>
            </li>
          )}
        </ul>

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none', padding: '0.3rem 0.6rem', borderRadius: '8px', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials(user?.username || '')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="user-name">{user?.username}</span>
              <span className="user-role" style={{ background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
                {user?.role}
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.6rem', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </div>

          {dropdownOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '0.5rem', minWidth: '180px', zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <NavLink
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', color: isActive ? '#f59e0b' : '#cbd5e1', background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 })}
              >
                ⚙️ Settings
              </NavLink>

              <div style={{ height: '1px', background: '#334155', margin: '0.4rem 0.5rem' }} />

              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.9rem', fontWeight: 500, textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                ⏻ Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}

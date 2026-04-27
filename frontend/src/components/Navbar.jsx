import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navItems = [
  { to: '/venue-weather', label: 'Venue & Weather', icon: '🏟️' },
  { to: '/playing-xi',    label: 'Playing XI',      icon: '👥' },
  { to: '/dls',           label: 'DLS Calculator',  icon: '🌧️' },
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

  const handleLogout = () => { logout(); navigate('/login') }

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
                <span>⚙️</span> Admin
              </NavLink>
            </li>
          )}
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-role" style={{
              background: roleStyle.bg, color: roleStyle.color,
              border: `1px solid ${roleStyle.border}`
            }}>
              {user?.role}
            </span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign out">⏻</button>
        </div>

      </div>
    </nav>
  )
}

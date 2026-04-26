import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navItems = [
  { to: '/venue-weather',  label: 'Venue & Weather', icon: '🏟️' },
  { to: '/playing-xi',     label: 'Playing XI',      icon: '👥' },
  { to: '/dls',            label: 'DLS Calculator',  icon: '🌧️' },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <img src="/cricksl-favicon.png" alt="CrickSL" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
          <span className="brand-text">
            Crick<span className="brand-accent">SL</span>
          </span>
        </NavLink>

        {/* Nav Links */}
        <ul className="navbar-links">
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span>{icon}</span> {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User Info + Logout */}
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className={`user-role ${user?.role}`}>{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign out">
            ⏻
          </button>
        </div>

      </div>
    </nav>
  )
}

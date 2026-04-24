import { NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🏏</span>
          <span className="brand-text">Crick<span className="brand-sl">SL</span></span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/venue-weather" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            🏟️ Venue & Weather
          </NavLink>
          <NavLink to="/playing-xi" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            👥 Playing XI
          </NavLink>
          <NavLink to="/dls" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            🌧️ DLS Calculator
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

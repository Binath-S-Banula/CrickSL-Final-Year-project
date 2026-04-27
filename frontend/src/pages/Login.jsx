import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'

export default function Login() {
  const [tab, setTab]               = useState('signin')
  const [username, setUsername]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [role, setRole]             = useState('analyst')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [loading, setLoading]       = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const resetForm = () => {
    setUsername(''); setEmail(''); setPassword('')
    setConfirmPwd(''); setRole('analyst'); setError(''); setSuccess('')
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter your username and password'); return }
    setLoading(true); setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!username || !email || !password || !confirmPwd) { setError('All fields are required'); return }
    if (password !== confirmPwd) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', { username, email, password, role })
      setSuccess('Account created successfully! You can now sign in.')
      resetForm()
      setTab('signin')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Username or email may already exist.')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoRow}>
          <img src="/cricksl-favicon.png" alt="CrickSL" style={s.logo} />
          <span style={s.brand}>Crick<span style={s.gold}>SL</span></span>
        </div>
        <p style={s.tagline}>T20 Cricket Decision Support System</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === 'signin' ? s.tabActive : {}) }}
            onClick={() => { setTab('signin'); resetForm() }}>
            Sign In
          </button>
          <button style={{ ...s.tab, ...(tab === 'signup' ? s.tabActive : {}) }}
            onClick={() => { setTab('signup'); resetForm() }}>
            Create Account
          </button>
        </div>

        {error   && <div style={s.alertError}>{error}</div>}
        {success && <div style={s.alertSuccess}>{success}</div>}

        {/* Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" type="text" placeholder="Enter your username"
                value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold btn-full" style={s.btn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div style={s.twoCol}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Username</label>
                <input className="form-control" type="text" placeholder="Choose a username"
                  value={username} onChange={e => setUsername(e.target.value)} autoFocus />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Role</label>
                <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="analyst">Analyst</option>
                  <option value="coach">Coach</option>
                  <option value="player">Player</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="Enter your email address"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={s.twoCol}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm Password</label>
                <input className="form-control" type="password" placeholder="Re-enter password"
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <div style={s.roleInfo}>
              <span style={s.roleInfoIcon}>ℹ️</span>
              <span>Admin accounts can only be created by existing administrators.</span>
            </div>
            <button type="submit" className="btn btn-gold btn-full" style={s.btn} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.divider} />
          <p style={s.footerText}>© {new Date().getFullYear()} CrickSL. All rights reserved.</p>
          <p style={s.footerSub}>Sri Lanka Cricket Analytics Platform</p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', background: 'var(--bg-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '480px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.65rem', marginBottom: '0.4rem',
  },
  logo: { width: '42px', height: '42px', borderRadius: '8px' },
  brand: {
    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
    fontSize: '2rem', color: '#f1f5f9', letterSpacing: '0.04em',
  },
  gold: { color: '#f59e0b' },
  tagline: {
    textAlign: 'center', color: 'var(--text-secondary)',
    fontSize: '0.82rem', marginBottom: '1.75rem',
  },
  tabs: {
    display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px', padding: '4px', marginBottom: '1.5rem',
  },
  tab: {
    flex: 1, padding: '0.6rem', borderRadius: '7px', border: 'none',
    cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
    background: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.18s',
  },
  tabActive: {
    background: 'var(--bg-secondary)', color: '#f59e0b',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  alertError: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: '8px', padding: '0.75rem 1rem',
    fontSize: '0.85rem', marginBottom: '1rem',
  },
  alertSuccess: {
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80', borderRadius: '8px', padding: '0.75rem 1rem',
    fontSize: '0.85rem', marginBottom: '1rem',
  },
  twoCol: { display: 'flex', gap: '0.75rem' },
  roleInfo: {
    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: '8px', padding: '0.65rem 0.85rem',
    fontSize: '0.78rem', color: '#93c5fd', marginBottom: '1rem',
  },
  roleInfoIcon: { flexShrink: 0, fontSize: '0.85rem' },
  btn: { marginTop: '0.25rem', padding: '0.85rem', fontSize: '0.95rem' },
  footer: { marginTop: '1.75rem', textAlign: 'center' },
  divider: { height: '1px', background: 'var(--border)', marginBottom: '1rem' },
  footerText: { color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' },
  footerSub: { color: 'var(--text-muted)', fontSize: '0.7rem' },
}

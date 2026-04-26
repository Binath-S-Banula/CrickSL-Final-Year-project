import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }    = useAuth()
  const navigate     = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter both username and password'); return }
    setLoading(true)
    setError('')
    try {
      const user = await login(username, password)
      navigate(user.role === 'admin' ? '/' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoRow}>
          <img src="/cricksl-favicon.png" alt="CrickSL" style={styles.logo} />
          <div style={styles.brand}>
            <span style={styles.brandWhite}>Crick</span>
            <span style={styles.brandGold}>SL</span>
          </div>
        </div>

        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to access the analytics dashboard</p>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-full"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '1rem' }}
          >
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        {/* Default credentials hint for demo */}
        <div style={styles.hint}>
          <div style={styles.hintTitle}>Demo Credentials</div>
          <div style={styles.hintRow}>
            <span style={styles.hintBadge}>Admin</span>
            <span style={styles.hintText}>admin / CrickSL@2026</span>
          </div>
          <div style={styles.hintRow}>
            <span style={{ ...styles.hintBadge, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>Analyst</span>
            <span style={styles.hintText}>analyst / Analyst@2026</span>
          </div>
        </div>

        <p style={styles.footer}>PUSL3190 · Rajapaksha Banula · 10953523</p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  logo: { width: '44px', height: '44px', borderRadius: '8px' },
  brand: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '1px' },
  brandWhite: { color: '#f1f5f9' },
  brandGold:  { color: '#f59e0b' },
  title:    { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.75rem' },
  hint: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  hintTitle: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' },
  hintRow:   { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' },
  hintBadge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
  hintText:  { fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' },
  footer:    { textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1.5rem' },
}

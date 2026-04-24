import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1f3d 50%, #0a0e1a 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(30,64,175,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏏</div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '3.5rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            color: '#f1f5f9',
          }}>
            Crick<span style={{ color: '#f59e0b' }}>SL</span>
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: '#94a3b8',
            marginBottom: '0.75rem',
            maxWidth: '600px',
            margin: '0 auto 0.75rem',
          }}>
            T20 Cricket Analytics & Decision Support System for Sri Lanka
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2.5rem' }}>
            Powered by 4,991 matches · 1.1M deliveries · Random Forest ML
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-gold" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
              onClick={() => navigate('/venue-weather')}>
              🏟️ Start Analysis
            </button>
            <button className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
              onClick={() => navigate('/playing-xi')}>
              👥 Select Playing XI
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h2 style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '1.5rem',
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: '3rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>Three Decision Modules</h2>

        <div className="grid-3">
          {/* Section 1 */}
          <div className="card" style={{ cursor: 'pointer', borderColor: 'rgba(59,130,246,0.3)' }}
            onClick={() => navigate('/venue-weather')}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏟️</div>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#f1f5f9' }}>
              Venue & Weather Analysis
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Opponent-adjusted par scores, phase-by-phase scoring patterns,
              dew risk, rain probability, swing conditions and toss recommendations.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Par Score</span>
              <span className="badge badge-blue">Dew Risk</span>
              <span className="badge badge-blue">Toss Advice</span>
            </div>
          </div>

          {/* Section 2 */}
          <div className="card" style={{ cursor: 'pointer', borderColor: 'rgba(245,158,11,0.3)' }}
            onClick={() => navigate('/playing-xi')}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#f1f5f9' }}>
              Playing XI Recommendation
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>
              MCDA-based player ranking using venue performance, recent form and
              opponent matchup analysis. Active players only — two-layer filter.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-medium">MCDA</span>
              <span className="badge badge-medium">Matchup</span>
              <span className="badge badge-medium">Active Filter</span>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card" style={{ cursor: 'pointer', borderColor: 'rgba(16,185,129,0.3)' }}
            onClick={() => navigate('/dls')}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌧️</div>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#f1f5f9' }}>
              DLS Rain Calculator
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Pre-match DLS analysis using ICC Standard Edition resource table.
              5-over milestone breakdown with required run rates and strategy.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-low">DLS Standard</span>
              <span className="badge badge-low">5-Over Table</span>
              <span className="badge badge-low">Strategy</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          textAlign: 'center',
        }}>
          {[
            { value: '4,991', label: 'T20 Matches' },
            { value: '1.1M', label: 'Deliveries Analysed' },
            { value: '72.7%', label: 'ML Accuracy' },
            { value: '329', label: 'SL Matches' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--sl-gold)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

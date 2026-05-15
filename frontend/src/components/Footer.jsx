export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '2.5rem 2rem 1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem',
        }}>

          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem',
              fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem',
            }}>
              Crick<span style={{ color: '#f59e0b' }}>SL</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: '300px' }}>
              A data-driven T20 cricket decision support system for Sri Lanka Cricket,
              built using 4,991 matches and 1.1M ball-by-ball delivery records.
            </p>
          </div>

          {/* Modules */}
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Modules
            </div>
            {['Venue & Weather', 'Playing XI', 'DLS Calculator', 'Reports', 'Player Analytics'].map(item => (
              <div key={item} style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                {item}
              </div>
            ))}
          </div>

          {/* System Info */}
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System
            </div>
            {[
              { label: 'Dataset',   val: 'Cricsheet T20I' },
              { label: 'ML Model',  val: 'Random Forest' },
              { label: 'Accuracy',  val: '72.7%' },
              { label: 'Backend',   val: 'FastAPI + PostgreSQL' },
              { label: 'Frontend',  val: 'React + Vite' },
            ].map(({ label, val }) => (
              <div key={label} style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}:</span> {val}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} CrickSL. All rights reserved. · Sri Lanka Cricket Analytics Platform
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            PUSL3190 Computing Project · University of Plymouth
          </div>
        </div>
      </div>
    </footer>
  )
}

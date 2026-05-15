import { useState, useEffect } from 'react'
import { getVenues, calculateDLS, TEAMS } from '../api/api'

const SL_PLAYERS = [
  'P Nissanka', 'K Mishara', 'BKG Mendis', 'KIC Asalanka', 'MD Shanaka',
  'DM de Silva', 'DN Wellalage', 'PHKD Mendis', 'M Theekshana',
  'M Pathirana', 'A Dananjaya', 'JDF Vandersay', 'C Madushanka',
  'NM Fernando', 'MADI Hemantha', 'V Vijayakanth', 'B Fernando',
]

export default function DLSCalculator() {
  const [venues, setVenues] = useState([])
  const [venueName, setVenueName] = useState('')
  const [opponent, setOpponent] = useState('')
  const [slRole, setSlRole] = useState('batting_first')
  const [overs, setOvers] = useState(20)
  const [xi, setXi] = useState(Array(11).fill(''))
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getVenues().then(r => setVenues(r.data)).catch(() => {})
  }, [])

  const fillDefaultXI = () => setXi(SL_PLAYERS.slice(0, 11))

  const updatePlayer = (i, val) => {
    const arr = [...xi]; arr[i] = val; setXi(arr)
  }

  const calculate = async () => {
    if (!venueName || !opponent) { setError('Please select venue and opponent'); return }
    const filled = xi.filter(p => p.trim())
    if (filled.length < 11) { setError('Please enter all 11 SL players'); return }
    setLoading(true); setError(''); setResults(null)
    try {
      const r = await calculateDLS({ venue_name: venueName, sl_role: slRole, opponent_team: opponent, playing_xi: filled, overs_available: overs })
      setResults(r.data)
    } catch (e) {
      setError('Calculation failed. Check inputs and try again.')
    }
    setLoading(false)
  }

  const getWicketColor = (wkts) => {
    if (wkts === 0) return '#10b981'
    if (wkts <= 2) return '#3b82f6'
    if (wkts <= 4) return '#f59e0b'
    if (wkts <= 6) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="page fade-in">
      <h1 className="page-title">🌧️ DLS Rain Interruption Calculator</h1>
      <p className="page-subtitle">Pre-match DLS milestone planning using venue par score and ICC Standard Edition resource table</p>

      <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
        ⚠️ This is a <strong>pre-match prediction tool</strong>. Actual DLS in live matches uses ICC Professional Edition software.
        Targets are based on historical venue data adjusted for the specific opponent.
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Inputs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Venue</label>
            <select className="form-control" value={venueName} onChange={e => setVenueName(e.target.value)}>
              <option value="">Select venue...</option>
              {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Opponent Team</label>
            <select className="form-control" value={opponent} onChange={e => setOpponent(e.target.value)}>
              <option value="">Select opponent...</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Sri Lanka Role</label>
            <select className="form-control" value={slRole} onChange={e => setSlRole(e.target.value)}>
              <option value="batting_first">Batting First</option>
              <option value="chasing">Chasing</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Overs Available</label>
            <select className="form-control" value={overs} onChange={e => setOvers(Number(e.target.value))}>
              {[5, 10, 15, 20].map(o => <option key={o} value={o}>{o} Overs</option>)}
            </select>
          </div>
        </div>

        {/* SL XI */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>SL Playing XI</label>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={fillDefaultXI}>
              Fill Default SL XI
            </button>
          </div>
          <div className="grid-2" style={{ gap: '0.5rem' }}>
            {xi.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)', minWidth: '1.5rem', fontSize: '0.9rem' }}>{i + 1}.</span>
                <input
                  className="form-control"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.88rem' }}
                  placeholder={`SL Player ${i + 1}`}
                  value={p}
                  onChange={e => updatePlayer(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-gold btn-full" onClick={calculate} disabled={loading}>
          {loading ? '⏳ Calculating...' : '🌧️ Calculate DLS Milestones'}
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner" /><span>Calculating DLS milestones...</span></div>}

      {results && (
        <div className="fade-in">
          {/* Par Score Summary */}
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="card-title">🎯 Par Score</div>
            <div className="grid-3">
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '3rem' }}>{results.par_score?.value}</div>
                <div className="stat-label">Target / Par Score</div>
                <div className="stat-sub">{results.par_score?.confidence} confidence</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.8rem' }}>{results.total_overs}</div>
                <div className="stat-label">Total Overs</div>
                <div className="stat-sub">{slRole === 'batting_first' ? 'SL bats first' : 'SL chasing'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.8rem' }}>{results.par_score?.value ? (results.par_score.value / results.total_overs).toFixed(2) : '—'}</div>
                <div className="stat-label">Required RRR</div>
                <div className="stat-sub">Runs per over needed</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div className="alert alert-info">
                📊 Source: <strong>{results.par_score?.source}</strong>
                {results.par_score?.all_estimates && (
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem' }}>
                    | Overall: {results.par_score.all_estimates.overall_venue_avg}
                    {' · '}SL at venue: {results.par_score.all_estimates.sl_at_venue}
                    {' · '}vs {opponent}: {results.par_score.all_estimates.sl_vs_opponent}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Strategy */}
          {results.strategy?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">📋 Match Strategy</div>
              {results.strategy.map((s, i) => (
                <div key={i} className="alert alert-info" style={{ marginBottom: '0.5rem' }}>{s}</div>
              ))}
            </div>
          )}

          {/* Milestone Table */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title">📊 5-Over DLS Milestone Table</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {slRole === 'batting_first'
                ? 'SL must be at these scores to stay ahead of DLS par if rain interrupts'
                : 'SL must chase these scores to win or be ahead of DLS par if rain interrupts'}
            </p>

            {/* Header */}
            <div className="milestone-row" style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Over</div>
              {[0, 2, 4, 6, 8].map(w => (
                <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', color: getWicketColor(w), textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  {w} Wkts
                </div>
              ))}
            </div>

            {results.milestone_table?.map((m, i) => (
              <div key={i} className="milestone-row">
                <div className="milestone-over">Ov {m.after_over}</div>
                {[0, 2, 4, 6, 8].map(w => {
                  const sc = m.wicket_scenarios?.[`${w}_wickets_down`]
                  return (
                    <div key={w} className="milestone-val" style={{ color: getWicketColor(w) }}>
                      <div className="runs" style={{ color: getWicketColor(w) }}>{sc?.par_score || '—'}</div>
                      <div className="rrr">{sc?.required_run_rate ? `${sc.required_run_rate} rpo` : ''}</div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Legend */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>How to read:</strong> Each cell shows the par score (runs) and required run rate (rpo = runs per over) needed for the remaining overs.
              Green = few wickets lost (easier position), Red = many wickets lost (difficult position).
            </div>
          </div>

          {/* Playing XI */}
          <div className="card">
            <div className="card-title">👥 SLC Playing XI — Batting Order</div>
            <div className="grid-2">
              {results.playing_xi?.batting_order?.map((p, i) => (
                <div key={i} className="player-card" style={{ padding: '0.75rem' }}>
                  <div className="player-number" style={{ fontSize: '1.2rem' }}>{p.position}</div>
                  <div className="player-info">
                    <div className="player-name">{p.player}</div>
                    <div className="player-role">{p.role}</div>
                  </div>
                  {i < 7
                    ? <span className="badge badge-blue">Batter</span>
                    : <span className="badge badge-high">Bowler</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

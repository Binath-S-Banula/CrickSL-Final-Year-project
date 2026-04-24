import { useState, useEffect } from 'react'
import { getVenues, getXIRecommendation, TEAMS } from '../api/api'

const ROLE_ICONS = { 'Batter': '🏏', 'Bowler': '⚾', 'All Rounder': '⚡', 'Wicket Keeper Batter': '🧤' }
const ROLE_COLORS = { 'Batter': '#3b82f6', 'Bowler': '#ef4444', 'All Rounder': '#f59e0b', 'Wicket Keeper Batter': '#10b981' }

// Default opponent XI for quick testing
const DEFAULT_INDIA_XI = [
  'Rohit Sharma', 'Virat Kohli', 'Shubman Gill', 'Suryakumar Yadav',
  'Hardik Pandya', 'Rishabh Pant', 'Ravindra Jadeja', 'Axar Patel',
  'Jasprit Bumrah', 'Mohammed Shami', 'Kuldeep Yadav'
]

export default function PlayingXI() {
  const [venues, setVenues] = useState([])
  const [venueName, setVenueName] = useState('')
  const [opponent, setOpponent] = useState('')
  const [oppXI, setOppXI] = useState(Array(11).fill(''))
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [showSquad, setShowSquad] = useState(false)
  const [activeTab, setActiveTab] = useState('xi')

  useEffect(() => {
    getVenues().then(r => setVenues(r.data)).catch(() => {})
  }, [])

  const fillDefaultXI = () => setOppXI(DEFAULT_INDIA_XI)

  const updateOppPlayer = (i, val) => {
    const arr = [...oppXI]
    arr[i] = val
    setOppXI(arr)
  }

  const recommend = async () => {
    if (!venueName || !opponent) { setError('Please select venue and opponent'); return }
    const filled = oppXI.filter(p => p.trim())
    if (filled.length < 11) { setError('Please enter all 11 opponent players'); return }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const r = await getXIRecommendation({ venue_name: venueName, opponent_team: opponent, opponent_xi: filled })
      setResults(r.data)
    } catch (e) {
      setError('Recommendation failed. Check all fields and try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page fade-in">
      <h1 className="page-title">👥 Playing XI Recommendation</h1>
      <p className="page-subtitle">MCDA-based player selection using venue performance, form and opponent matchup analysis</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Input Panel */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
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
        </div>

        {/* Opponent XI */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Opponent Playing XI</label>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={fillDefaultXI}>
              Fill India XI (Test)
            </button>
          </div>
          <div className="grid-2" style={{ gap: '0.5rem' }}>
            {oppXI.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)', minWidth: '1.5rem', fontSize: '0.9rem' }}>{i + 1}.</span>
                <input
                  className="form-control"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.88rem' }}
                  placeholder={`Player ${i + 1}`}
                  value={p}
                  onChange={e => updateOppPlayer(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-gold btn-full" onClick={recommend} disabled={loading}>
          {loading ? '⏳ Analysing...' : '🔍 Get XI Recommendation'}
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner" /><span>Running MCDA analysis...</span></div>}

      {results && (
        <div className="fade-in">
          {/* Selection Info */}
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <strong>Active Player Pool: {results.active_player_pool_size} players</strong>
            {' · '}{results.selection_criteria?.layer_1}
            {' · '}{results.selection_criteria?.layer_2}
          </div>

          {/* Tabs */}
          <div className="section-tabs" style={{ marginBottom: '1.5rem' }}>
            {[
              { id: 'xi', label: '⚡ Recommended XI' },
              { id: 'squad', label: '📋 Full Squad 17' },
              { id: 'matchup', label: '🎯 Matchup Insights' },
            ].map(t => (
              <div key={t.id} className={`section-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </div>
            ))}
          </div>

          {/* Recommended XI */}
          {activeTab === 'xi' && (
            <div className="fade-in">
              {/* Balance */}
              <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                {[
                  { v: results.xi_balance?.left_hand_batters, l: 'Left-Handers' },
                  { v: results.xi_balance?.right_hand_batters, l: 'Right-Handers' },
                  { v: results.xi_balance?.spinners, l: 'Spinners' },
                  { v: results.xi_balance?.pace_bowlers, l: 'Pace Bowlers' },
                ].map(s => (
                  <div key={s.l} className="stat-card">
                    <div className="stat-value">{s.v}</div>
                    <div className="stat-label">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Balance Warnings */}
              {results.balance_warnings?.map((w, i) => (
                <div key={i} className="alert alert-warning" style={{ marginBottom: '0.5rem' }}>{w}</div>
              ))}

              {/* XI Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {results.recommended_xi?.map((p, i) => (
                  <div key={i} className="player-card">
                    <div className="player-number">{p.position}</div>
                    <div style={{ fontSize: '1.5rem' }}>{ROLE_ICONS[p.role] || '🏏'}</div>
                    <div className="player-info">
                      <div className="player-name">{p.name}</div>
                      <div className="player-role">
                        <span style={{ color: ROLE_COLORS[p.role] || '#94a3b8' }}>{p.role}</span>
                        {' · '}{p.batting_style}
                        {p.bowling_style && p.bowling_style !== 'None' && ` · ${p.bowling_style}`}
                      </div>
                      {p.reasons?.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {p.reasons.slice(0, 2).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="player-score">{p.selection_score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Squad */}
          {activeTab === 'squad' && (
            <div className="fade-in card">
              <div className="card-title">📋 Full Squad of 17 — Ranked by Score</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Role</th>
                    <th>Batting</th>
                    <th>Score</th>
                    <th>XI?</th>
                  </tr>
                </thead>
                <tbody>
                  {results.squad_17?.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--sl-gold)', fontFamily: 'Rajdhani', fontWeight: 700 }}>{p.rank}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <span style={{ color: ROLE_COLORS[p.role] || '#94a3b8', fontSize: '0.85rem' }}>
                          {ROLE_ICONS[p.role]} {p.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.batting_style}</td>
                      <td style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-blue-light)' }}>{p.selection_score}</td>
                      <td>
                        {p.in_recommended_xi
                          ? <span className="badge badge-low">✓ XI</span>
                          : <span className="badge" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Reserve</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Matchup Insights */}
          {activeTab === 'matchup' && (
            <div className="fade-in">
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div className="card-title">🎯 Opponent Analysis</div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bowling Types</div>
                    {Object.entries(results.opponent_analysis?.bowler_types || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{k}</span>
                        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Batting Hands</div>
                    {Object.entries(results.opponent_analysis?.batter_types || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{k}</span>
                        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">🏆 Top Matchup Picks</div>
                  {results.top_matchup_picks?.map((p, i) => (
                    <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)' }}>{p.matchup_score}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.key_reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">💡 Strategic Insights</div>
                {results.matchup_insights?.map((insight, i) => (
                  <div key={i} className="alert alert-info" style={{ marginBottom: '0.5rem' }}>{insight}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

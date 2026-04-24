import { useState, useEffect } from 'react'
import { getVenues, getVenueStats, getVenueParScore, getVenuePhaseStats, getWeatherConditions, TEAMS } from '../api/api'

export default function VenueWeather() {
  const [venues, setVenues] = useState([])
  const [venueId, setVenueId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [opponent, setOpponent] = useState('')
  const [slRole, setSlRole] = useState('batting')
  const [matchDate, setMatchDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getVenues().then(r => setVenues(r.data)).catch(() => setError('Cannot connect to backend. Make sure server is running.'))
  }, [])

  const handleVenueChange = (e) => {
    const id = e.target.value
    setVenueId(id)
    const v = venues.find(v => String(v.id) === id)
    if (v) setVenueName(v.name)
    setResults(null)
  }

  const analyse = async () => {
    if (!venueId) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const [stats, par, phase, weather] = await Promise.all([
        getVenueStats(venueId, opponent),
        getVenueParScore(venueId, slRole, opponent),
        getVenuePhaseStats(venueId),
        matchDate ? getWeatherConditions(venueName, slRole === 'batting', matchDate) : null,
      ])
      setResults({ stats: stats.data, par: par.data, phase: phase.data, weather: weather?.data })
    } catch (e) {
      setError('Analysis failed. Check your inputs and try again.')
    }
    setLoading(false)
  }

  const riskColor = (label) => {
    if (!label) return '#64748b'
    const l = label.toUpperCase()
    if (l === 'HIGH' || l === 'EXTREME') return '#ef4444'
    if (l === 'MEDIUM') return '#f59e0b'
    return '#10b981'
  }

  const riskWidth = (score) => `${Math.min(100, Math.round((score || 0) * 100))}%`

  return (
    <div className="page fade-in">
      <h1 className="page-title">🏟️ Venue & Weather Analysis</h1>
      <p className="page-subtitle">Opponent-adjusted par scores, phase analytics and weather conditions</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Venue</label>
            <select className="form-control" value={venueId} onChange={handleVenueChange}>
              <option value="">Select venue...</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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
              <option value="batting">Batting First</option>
              <option value="bowling">Bowling First (Chasing)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Match Date (for live weather)</label>
            <input type="date" className="form-control" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-gold btn-full" onClick={analyse} disabled={!venueId || loading}>
            {loading ? '⏳ Analysing...' : '🔍 Analyse Venue & Weather'}
          </button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" /><span>Running analysis...</span></div>}

      {results && (
        <div className="fade-in">
          {/* Par Score */}
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="card-title">📊 Par Score Analysis</div>
            <div className="grid-4" style={{ marginBottom: '1rem' }}>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '2.5rem' }}>
                  {results.par?.recommended?.par_score || '—'}
                </div>
                <div className="stat-label">Recommended Par</div>
                <div className="stat-sub">{results.par?.recommended?.source}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{results.par?.overall_venue_average?.par_score || '—'}</div>
                <div className="stat-label">Overall Venue Avg</div>
                <div className="stat-sub">{results.par?.overall_venue_average?.matches} matches</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{results.par?.sl_at_venue?.par_score || '—'}</div>
                <div className="stat-label">SL at Venue</div>
                <div className="stat-sub">{results.par?.sl_at_venue?.matches} matches</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {results.par?.sl_vs_opponent_at_venue?.par_score || '—'}
                </div>
                <div className="stat-label">SL vs {opponent || 'Opponent'}</div>
                <div className="stat-sub">{results.par?.sl_vs_opponent_at_venue?.matches || 0} matches</div>
              </div>
            </div>
            <div className="alert alert-info">
              💡 {results.par?.recommended?.interpretation}
            </div>
          </div>

          {/* Venue Stats */}
          {results.stats && (
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div className="card-title">🏟️ Venue Overview</div>
                <div className="grid-2">
                  {[
                    { v: results.stats.total_matches, l: 'Total Matches' },
                    { v: results.stats.avg_first_innings_score, l: '1st Innings Avg' },
                    { v: results.stats.avg_second_innings_score, l: '2nd Innings Avg' },
                    { v: results.stats.toss_recommendation, l: 'Toss Recommendation' },
                  ].map(s => (
                    <div key={s.l} className="stat-card">
                      <div className="stat-value" style={{ fontSize: typeof s.v === 'string' ? '0.9rem' : '1.8rem', textTransform: 'uppercase' }}>
                        {s.v}
                      </div>
                      <div className="stat-label">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">🏆 Win % by Decision</div>
                <div style={{ marginTop: '0.5rem' }}>
                  {[
                    { label: 'Bat First Wins', pct: results.stats.bat_first_win_pct, wins: results.stats.bat_first_wins },
                    { label: 'Chase Wins', pct: results.stats.chase_win_pct, wins: results.stats.chase_wins },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)' }}>{r.pct}%</span>
                      </div>
                      <div className="risk-bar">
                        <div className="risk-fill" style={{ width: `${r.pct}%`, background: r.pct > 50 ? 'var(--success)' : 'var(--sl-blue-light)' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{r.wins} wins</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Phase Stats */}
          {results.phase?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">⚡ Phase-by-Phase Scoring</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Overs</th>
                    <th>Avg Runs/Over</th>
                    <th>Avg Wickets/Over</th>
                    <th>Character</th>
                  </tr>
                </thead>
                <tbody>
                  {results.phase.map(p => (
                    <tr key={p.phase}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--sl-gold)' }}>{p.phase}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {p.phase === 'powerplay' ? '1-6' : p.phase === 'middle' ? '7-15' : '16-20'}
                      </td>
                      <td><span style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>{p.avg_runs}</span></td>
                      <td>{p.avg_wickets}</td>
                      <td>
                        <span className={`badge ${p.avg_runs > 8 ? 'badge-high' : p.avg_runs > 6 ? 'badge-medium' : 'badge-low'}`}>
                          {p.avg_runs > 8 ? 'High Scoring' : p.avg_runs > 6 ? 'Moderate' : 'Slow'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Weather */}
          {results.weather && (
            <div className="card" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
              <div className="card-title">🌤️ Weather Conditions</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <span className="badge badge-blue">{results.weather.weather_source}</span>
              </div>

              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: 'Humidity', value: `${results.weather.conditions?.humidity_pct}%`, icon: '💧' },
                  { label: 'Rain Probability', value: `${results.weather.conditions?.rain_probability_pct}%`, icon: '🌧️' },
                  { label: 'Cloud Cover', value: `${results.weather.conditions?.cloud_cover_pct}%`, icon: '☁️' },
                ].map(c => (
                  <div key={c.label} className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{c.icon}</div>
                    <div className="stat-value" style={{ fontSize: '1.8rem' }}>{c.value}</div>
                    <div className="stat-label">{c.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: 'Dew Risk', score: results.weather.risk_scores?.dew_risk, badge: results.weather.risk_scores?.dew_risk_label },
                  { label: 'Rain Risk', score: results.weather.risk_scores?.rain_risk, badge: results.weather.risk_scores?.rain_risk_label },
                  { label: 'Swing Conditions', score: results.weather.risk_scores?.swing_conditions, badge: results.weather.risk_scores?.swing_label },
                ].map(r => (
                  <div key={r.label} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.label}</span>
                      <span className="badge" style={{ background: `${riskColor(r.badge)}22`, color: riskColor(r.badge), border: `1px solid ${riskColor(r.badge)}44` }}>
                        {r.badge}
                      </span>
                    </div>
                    <div className="risk-bar">
                      <div className="risk-fill" style={{ width: riskWidth(r.score), background: riskColor(r.badge) }} />
                    </div>
                  </div>
                ))}
              </div>

              {results.weather.sl_impact_analysis?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    SL Impact Analysis
                  </div>
                  {results.weather.sl_impact_analysis.map((item, i) => (
                    <div key={i} className="alert alert-info" style={{ marginBottom: '0.5rem' }}>
                      {item}
                    </div>
                  ))}
                </div>
              )}

              <div className="divider" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Toss Recommendation</div>
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--sl-gold)', fontSize: '1rem' }}>
                  {results.weather.toss_recommendation}
                </div>
                <span className={`badge ${results.weather.recommendation_strength === 'STRONG' ? 'badge-high' : 'badge-medium'}`}>
                  {results.weather.recommendation_strength}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

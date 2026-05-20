import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import api from '../api/api'

const TEAMS = [
  'India', 'Australia', 'England', 'Pakistan', 'South Africa',
  'New Zealand', 'West Indies', 'Bangladesh', 'Afghanistan', 'Zimbabwe',
]

const COLORS = {
  powerplay: '#f59e0b', middle: '#3b82f6', death: '#10b981',
  batFirst: '#f59e0b', chase: '#3b82f6',
}

const tooltipStyle = {
  background: '#0f1929', border: '1px solid #1e3a5f',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '0.82rem',
}

export default function Reports() {
  const [venue, setVenue]         = useState('')
  const [team2, setTeam2]         = useState('')
  const [tossWinner, setTossWinner] = useState('Sri Lanka')
  const [tossDecision, setTossDecision] = useState('bat')
  const [report, setReport]       = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [predLoading, setPredLoading] = useState(false)
  const [error, setError]         = useState('')
  const [venues, setVenues]       = useState([])
  const [showPredConfig, setShowPredConfig] = useState(false)

  useEffect(() => {
    api.get('/admin-data/venues?country=Sri Lanka')
      .then(r => setVenues(r.data))
      .catch(() => {})
  }, [])

  const generateReport = async () => {
    if (!venue || !team2) { setError('Please select a venue and opponent team'); return }
    setLoading(true); setError(''); setReport(null); setPrediction(null)
    try {
      const res = await api.get('/prematch', {
        params: { venue_name: venue, team1: 'Sri Lanka', team2 }
      })
      setReport(res.data)
      setShowPredConfig(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Please try again.')
    }
    setLoading(false)
  }

  const runPrediction = async () => {
    if (!venue || !team2) return
    setPredLoading(true); setPrediction(null)
    try {
      const res = await api.post('/predict/', {
        venue_name: venue,
        toss_winner: tossWinner,
        toss_decision: tossDecision,
        team1: 'Sri Lanka',
        team2,
      })
      setPrediction(res.data)
    } catch (err) {
      setPrediction({ error: 'Prediction unavailable — insufficient match data for this combination.' })
    }
    setPredLoading(false)
  }

  const handlePrint = () => window.print()

  const activeBatters = report?.team1_top_batters || []
  const activeBowlers = report?.team1_top_bowlers || []

  const phaseData = (report?.phase_stats || []).map(p => ({
    name: p.phase.charAt(0).toUpperCase() + p.phase.slice(1),
    'Avg Runs': parseFloat((p.avg_runs || 0).toFixed(1)),
    'Run Rate': parseFloat((p.run_rate || 0).toFixed(2)),
  }))

  const tossData = report?.venue_stats ? [
    { name: 'Bat First Wins', value: report.venue_stats.bat_first_wins || 0 },
    { name: 'Chase Wins',     value: report.venue_stats.chase_wins || 0 },
  ] : []

  const batterChart = activeBatters.slice(0, 6).map(b => ({
    name: b.name.split(' ').slice(-1)[0],
    fullName: b.name,
    'Strike Rate': parseFloat((b.strike_rate || 0).toFixed(1)),
  }))

  const bowlerChart = activeBowlers.slice(0, 6).map(b => ({
    name: b.name.split(' ').slice(-1)[0],
    fullName: b.name,
    'Economy': parseFloat((b.economy || 0).toFixed(2)),
  }))

  const slProb = prediction?.sl_win_probability || 0
  const oppProb = prediction?.opponent_win_probability || 0
  const isFavoured = slProb >= 50

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.3) }
          50%      { box-shadow: 0 0 20px 4px rgba(245,158,11,0.15) }
        }
        .pred-card { animation: fadeIn 0.5s ease forwards; }
        .prob-bar-fill { transition: width 1.2s cubic-bezier(.4,0,.2,1); }
        @media print {
          .no-print { display: none !important; }
          .navbar   { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { background: white !important; }
        }
      `}</style>

      <div style={s.page} className="print-page">
        <div style={s.container}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Pre-Match Report</h1>
              <p style={s.subtitle}>Comprehensive analytics + ML win probability prediction</p>
            </div>
            {report && (
              <button className="btn btn-gold no-print" style={s.printBtn} onClick={handlePrint}>
                🖨️ Print / Save PDF
              </button>
            )}
          </div>

          {/* Config */}
          <div style={s.configCard} className="no-print">
            <h2 style={s.cardTitle}>Match Configuration</h2>
            <div style={s.configGrid}>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <select className="form-control" value={venue} onChange={e => setVenue(e.target.value)}>
                  <option value="">Select venue...</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.raw_name}>{v.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team 1</label>
                <input className="form-control" value="Sri Lanka" disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Opponent Team</label>
                <select className="form-control" value={team2} onChange={e => setTeam2(e.target.value)}>
                  <option value="">Select opponent...</option>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {error && <div style={s.alertError}>{error}</div>}
            <button className="btn btn-gold" style={s.generateBtn}
              onClick={generateReport} disabled={loading}>
              {loading ? '⏳ Generating...' : '📊 Generate Report'}
            </button>
          </div>

          {loading && (
            <div style={s.loadingCard}>
              <div style={s.spinner} />
              <p style={{ color: 'var(--text-secondary)' }}>Analysing match data...</p>
            </div>
          )}

          {report && !loading && (
            <>
              <div style={{ display: 'none' }} className="print-header">
                <h2>CrickSL — Pre-Match Report</h2>
                <p>{venue} | Sri Lanka vs {team2} | {new Date().toLocaleDateString()}</p>
              </div>

              {/* Summary Cards */}
              <div style={s.summaryGrid}>
                <SummaryCard icon="🏟️" label="Venue"
                  value={report.venue_name || venue} sub="Match location" />
                <SummaryCard icon="📊" label="Total Matches"
                  value={report.venue_stats?.total_matches || '—'} sub="at this venue" />
                <SummaryCard icon="📈" label="Avg 1st Innings"
                  value={report.venue_stats?.avg_first_innings_score?.toFixed(0) || '—'}
                  sub="runs batting first" />
                <SummaryCard icon="🎯" label="Toss Recommendation"
                  value={report.toss_recommendation || report.venue_stats?.toss_recommendation || '—'}
                  sub="based on historical data" highlight />
              </div>

              {/* ══════════════════════════════════════════
                  ML WIN PROBABILITY PREDICTION SECTION
              ══════════════════════════════════════════ */}
              {showPredConfig && (
                <div style={s.mlSection} className="no-print">
                  <div style={s.mlSectionHeader}>
                    <div>
                      <h2 style={s.mlSectionTitle}>
                        🤖 ML Win Probability Prediction
                      </h2>
                      <p style={s.mlSectionSub}>
                        Random Forest classifier — trained on {' '}
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>4,991 T20I matches</span>
                        {' '} · 72.7% accuracy · 10 features
                      </p>
                    </div>
                    <span style={s.mlBadge}>Random Forest v2.0</span>
                  </div>

                  {/* Toss inputs for prediction */}
                  <div style={s.predInputRow}>
                    <div style={s.predInputGroup}>
                      <label style={s.predLabel}>Toss Winner</label>
                      <select style={s.predSelect}
                        value={tossWinner} onChange={e => setTossWinner(e.target.value)}>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value={team2}>{team2}</option>
                      </select>
                    </div>
                    <div style={s.predInputGroup}>
                      <label style={s.predLabel}>Toss Decision</label>
                      <select style={s.predSelect}
                        value={tossDecision} onChange={e => setTossDecision(e.target.value)}>
                        <option value="bat">Bat First</option>
                        <option value="field">Field First (Chase)</option>
                      </select>
                    </div>
                    <button style={s.predBtn} onClick={runPrediction} disabled={predLoading}>
                      {predLoading ? '⏳ Predicting...' : '🎯 Predict Win Probability'}
                    </button>
                  </div>

                  {/* Prediction Result */}
                  {prediction && !prediction.error && (
                    <div style={s.predResult} className="pred-card">

                      {/* Main probability display */}
                      <div style={s.probRow}>
                        {/* SL side */}
                        <div style={{ ...s.probTeam, ...(isFavoured ? s.probTeamWinner : {}) }}>
                          <div style={s.probFlag}>🇱🇰</div>
                          <div style={s.probTeamName}>Sri Lanka</div>
                          <div style={{ ...s.probValue, color: isFavoured ? '#10b981' : '#94a3b8' }}>
                            {slProb}%
                          </div>
                          {isFavoured && <div style={s.favouredBadge}>FAVOURED ✓</div>}
                        </div>

                        {/* VS divider */}
                        <div style={s.vsDivider}>
                          <div style={s.vsText}>VS</div>
                          <div style={s.vsSubtext}>Win Probability</div>
                        </div>

                        {/* Opponent side */}
                        <div style={{ ...s.probTeam, ...(!isFavoured ? s.probTeamWinner : {}) }}>
                          <div style={s.probFlag}>🏏</div>
                          <div style={s.probTeamName}>{team2}</div>
                          <div style={{ ...s.probValue, color: !isFavoured ? '#ef4444' : '#94a3b8' }}>
                            {oppProb}%
                          </div>
                          {!isFavoured && <div style={{ ...s.favouredBadge, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>FAVOURED ✓</div>}
                        </div>
                      </div>

                      {/* Probability bars */}
                      <div style={s.probBarsSection}>
                        <div style={s.probBarRow}>
                          <span style={s.probBarLabel}>🇱🇰 Sri Lanka</span>
                          <div style={s.probBarTrack}>
                            <div className="prob-bar-fill" style={{
                              ...s.probBarFill,
                              width: `${slProb}%`,
                              background: isFavoured
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : 'linear-gradient(90deg, #64748b, #94a3b8)'
                            }} />
                          </div>
                          <span style={s.probBarPct}>{slProb}%</span>
                        </div>
                        <div style={s.probBarRow}>
                          <span style={s.probBarLabel}>🏏 {team2}</span>
                          <div style={s.probBarTrack}>
                            <div className="prob-bar-fill" style={{
                              ...s.probBarFill,
                              width: `${oppProb}%`,
                              background: !isFavoured
                                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                : 'linear-gradient(90deg, #64748b, #94a3b8)'
                            }} />
                          </div>
                          <span style={s.probBarPct}>{oppProb}%</span>
                        </div>
                      </div>

                      {/* Recommendation banner */}
                      <div style={{
                        ...s.recommendationBanner,
                        background: isFavoured
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                          : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                        border: `1px solid ${isFavoured ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>{isFavoured ? '✅' : '⚠️'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem',
                            color: isFavoured ? '#10b981' : '#ef4444' }}>
                            {prediction.recommendation}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Model: Random Forest Classifier · Accuracy: 72.7% · Features: 10
                          </div>
                        </div>
                      </div>

                      {/* Key factors */}
                      <div style={s.factorsSection}>
                        <h4 style={s.factorsTitle}>📋 Key Prediction Factors</h4>
                        <p style={s.factorsSub}>
                          These are the 10 features the Random Forest model weighted to produce this prediction
                        </p>
                        <div style={s.factorsList}>
                          {(prediction.key_factors || []).map((factor, i) => (
                            <div key={i} style={s.factorItem}>
                              <span style={s.factorIcon}>
                                {factor.includes('form') ? '📈'
                                  : factor.includes('Dew') || factor.includes('dew') ? '💧'
                                  : factor.includes('toss') || factor.includes('Toss') ? '🪙'
                                  : factor.includes('head') || factor.includes('Head') ? '⚔️'
                                  : factor.includes('Batting') || factor.includes('batting') ? '🏏'
                                  : '📊'}
                              </span>
                              <span style={s.factorText}>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Model info footer */}
                      <div style={s.modelInfo}>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Algorithm</span>
                          <span style={s.modelInfoValue}>Random Forest (scikit-learn)</span>
                        </div>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Training Data</span>
                          <span style={s.modelInfoValue}>4,991 T20I matches · Cricsheet</span>
                        </div>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Test Accuracy</span>
                          <span style={{ ...s.modelInfoValue, color: '#f59e0b', fontWeight: 700 }}>72.7%</span>
                        </div>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Features Used</span>
                          <span style={s.modelInfoValue}>10 (venue, form, toss, dew, H2H)</span>
                        </div>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Validation</span>
                          <span style={s.modelInfoValue}>80/20 split · 5-fold CV</span>
                        </div>
                        <div style={s.modelInfoItem}>
                          <span style={s.modelInfoLabel}>Model File</span>
                          <span style={s.modelInfoValue}>backend/ml/win_model.pkl</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {prediction?.error && (
                    <div style={{ ...s.alertError, marginTop: '1rem' }}>
                      ⚠️ {prediction.error}
                    </div>
                  )}
                </div>
              )}

              {/* Data Period Warning */}
              {report.player_data_years > 3 && (
                <div style={s.dataWarning}>
                  <span style={s.warningIcon}>⚠️</span>
                  <div>
                    <strong style={{ color: '#fbbf24', fontSize: '0.88rem' }}>
                      Limited Recent Match Data at This Venue
                    </strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      Player statistics below are based on the last <strong style={{ color: '#fbbf24' }}>{report.player_data_years} years</strong> of
                      available data. For the most current analysis, update the match dataset.
                    </p>
                  </div>
                </div>
              )}

              {/* Charts Row 1 */}
              <div style={s.chartsRow}>
                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Phase-wise Scoring Analysis</h3>
                  <p style={s.chartSub}>Average runs per phase at {venue}</p>
                  {phaseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={phaseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="Avg Runs" fill={COLORS.powerplay} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <NoData />}
                </div>

                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Bat First vs Chase Win %</h3>
                  <p style={s.chartSub}>Win distribution at {venue}</p>
                  {tossData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={tossData} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                          paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
                          labelLine={false}>
                          <Cell fill={COLORS.batFirst} />
                          <Cell fill={COLORS.chase} />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <NoData />}
                </div>
              </div>

              {/* Charts Row 2 */}
              <div style={s.chartsRow}>
                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Current Squad — Top Batters at Venue</h3>
                  <p style={s.chartSub}>Strike rate of active SL players at {venue}</p>
                  {batterChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={batterChart} layout="vertical"
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle}
                          formatter={(v, n, p) => [v, p.payload.fullName]} />
                        <Bar dataKey="Strike Rate" fill={COLORS.death} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No current squad batting data at this venue
                    </div>
                  )}
                </div>

                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Current Squad — Top Bowlers at Venue</h3>
                  <p style={s.chartSub}>Economy rate of active SL players (lower is better)</p>
                  {bowlerChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={bowlerChart} layout="vertical"
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle}
                          formatter={(v, n, p) => [v, p.payload.fullName]} />
                        <Bar dataKey="Economy" fill={COLORS.middle} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No current squad bowling data at this venue
                    </div>
                  )}
                </div>
              </div>

              {/* Player Tables */}
              <div style={s.chartsRow}>
                <PlayerTable title="Current Squad — Batting Stats" players={activeBatters} type="batting" />
                <PlayerTable title="Current Squad — Bowling Stats" players={activeBowlers} type="bowling" />
              </div>

              {/* Footer */}
              <div style={s.reportFooter}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {venue} | Sri Lanka vs {team2}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Based on historical T20I data · ML prediction: Random Forest 72.7% accuracy ·
                  © {new Date().getFullYear()} CrickSL. All rights reserved.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function SummaryCard({ icon, label, value, sub, highlight }) {
  return (
    <div style={{ ...s.summaryCard, ...(highlight ? s.summaryHighlight : {}) }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: highlight ? '#f59e0b' : 'var(--text-primary)', fontFamily: "'Rajdhani', sans-serif", marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function PlayerTable({ title, players, type }) {
  if (!players || players.length === 0) return (
    <div style={{ ...s.chartCard, flex: 1 }}>
      <h3 style={s.chartTitle}>{title}</h3>
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No current squad data available at this venue
      </div>
    </div>
  )
  return (
    <div style={{ ...s.chartCard, flex: 1 }}>
      <h3 style={s.chartTitle}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            <th style={s.th}>Player</th>
            {type === 'batting'
              ? <><th style={s.th}>Runs</th><th style={s.th}>Avg</th><th style={s.th}>SR</th></>
              : <><th style={s.th}>Wkts</th><th style={s.th}>Avg</th><th style={s.th}>Eco</th></>
            }
          </tr>
        </thead>
        <tbody>
          {players.slice(0, 6).map((p, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={s.td}>{p.name}</td>
              {type === 'batting' ? (
                <>
                  <td style={{ ...s.td, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{p.runs}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{p.average?.toFixed(1)}</td>
                  <td style={{ ...s.td, textAlign: 'center', color: '#10b981' }}>{p.strike_rate?.toFixed(1)}</td>
                </>
              ) : (
                <>
                  <td style={{ ...s.td, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{p.wickets}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{p.average?.toFixed(1)}</td>
                  <td style={{ ...s.td, textAlign: 'center', color: '#3b82f6' }}>{p.economy?.toFixed(2)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NoData() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 200, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      No data available
    </div>
  )
}

const s = {
  page:       { background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1.5rem' },
  container:  { maxWidth: '1280px', margin: '0 auto' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' },
  title:      { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle:   { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  printBtn:   { padding: '0.65rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  configCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem' },
  cardTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' },
  configGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  alertError: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' },
  generateBtn:{ padding: '0.75rem 2rem', fontSize: '0.95rem' },
  loadingCard:{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  spinner:    { width: '38px', height: '38px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  summaryGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard:{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' },
  summaryHighlight: { border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' },
  chartsRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
  chartCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' },
  chartTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  chartSub:   { color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '1.25rem' },
  th:         { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  td:         { padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)' },
  reportFooter: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' },
  dataWarning: { display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  warningIcon: { fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' },

  // ── ML Section styles ──
  mlSection:       { background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' },
  mlSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  mlSectionTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  mlSectionSub:    { color: 'var(--text-secondary)', fontSize: '0.83rem' },
  mlBadge:         { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' },
  predInputRow:    { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' },
  predInputGroup:  { display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '160px' },
  predLabel:       { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  predSelect:      { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0.55rem 0.85rem', fontSize: '0.88rem', cursor: 'pointer' },
  predBtn:         { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.4rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  predResult:      { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '0.5rem' },

  // probability display
  probRow:         { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  probTeam:        { textAlign: 'center', flex: 1, minWidth: '120px', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' },
  probTeamWinner:  { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' },
  probFlag:        { fontSize: '2.2rem', marginBottom: '0.4rem' },
  probTeamName:    { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' },
  probValue:       { fontFamily: "'Rajdhani', sans-serif", fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.5rem' },
  favouredBadge:   { display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.7rem', fontWeight: 700 },
  vsDivider:       { textAlign: 'center', padding: '0 1rem' },
  vsText:          { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' },
  vsSubtext:       { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' },

  // probability bars
  probBarsSection: { marginBottom: '1.25rem' },
  probBarRow:      { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' },
  probBarLabel:    { fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: '110px' },
  probBarTrack:    { flex: 1, height: '10px', background: 'rgba(255,255,255,0.07)', borderRadius: '5px', overflow: 'hidden' },
  probBarFill:     { height: '100%', borderRadius: '5px' },
  probBarPct:      { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'right' },

  // recommendation
  recommendationBanner: { display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },

  // key factors
  factorsSection:  { marginBottom: '1.25rem' },
  factorsTitle:    { fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' },
  factorsSub:      { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' },
  factorsList:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' },
  factorItem:      { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.83rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.05)' },
  factorIcon:      { fontSize: '0.95rem', flexShrink: 0, marginTop: '0.05rem' },
  factorText:      { lineHeight: 1.45 },

  // model info
  modelInfo:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' },
  modelInfoItem:   { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  modelInfoLabel:  { fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modelInfoValue:  { fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 },
}

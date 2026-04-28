import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../api/api'

const VENUES = [
  'R Premadasa Stadium', 'Pallekele International Cricket Stadium',
  'Galle International Stadium', 'Sinhalese Sports Club Ground',
  'Rangiri Dambulla International Stadium',
]

const TEAMS = [
  'India', 'Australia', 'England', 'Pakistan', 'South Africa',
  'New Zealand', 'West Indies', 'Bangladesh', 'Afghanistan', 'Zimbabwe',
]

// Backend now filters by rolling 3-year window — no hardcoded list needed

const COLORS = {
  powerplay: '#f59e0b', middle: '#3b82f6', death: '#10b981',
  batFirst: '#f59e0b', chase: '#3b82f6',
}

const tooltipStyle = {
  background: '#0f1929', border: '1px solid #1e3a5f',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '0.82rem',
}

export default function Reports() {
  const [venue, setVenue]     = useState('')
  const [team2, setTeam2]     = useState('')
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const generateReport = async () => {
    if (!venue || !team2) { setError('Please select a venue and opponent team'); return }
    setLoading(true); setError(''); setReport(null)
    try {
      const res = await api.get('/prematch', {
        params: { venue_name: venue, team1: 'Sri Lanka', team2 }
      })
      setReport(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Please try again.')
    }
    setLoading(false)
  }

  const handlePrint = () => window.print()

  // Filter to active players only
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

  return (
    <>
      {/* Print styles */}
      <style>{`
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
              <p style={s.subtitle}>Generate comprehensive analytics and insights before a match</p>
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
                  {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
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
              {/* Print header - only shows when printing */}
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
                  Based on historical T20I data · Only current squad players shown ·
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
}

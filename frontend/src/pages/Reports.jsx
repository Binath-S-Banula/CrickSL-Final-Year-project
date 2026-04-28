import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
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

const COLORS = {
  powerplay: '#f59e0b',
  middle:    '#3b82f6',
  death:     '#10b981',
  batFirst:  '#f59e0b',
  chase:     '#3b82f6',
  sl:        '#10b981',
  opp:       '#ef4444',
}

const ROLE_COLORS = {
  admin:   '#fbbf24',
  analyst: '#60a5fa',
  coach:   '#4ade80',
  player:  '#c084fc',
}

export default function Reports() {
  const [venue, setVenue]     = useState('')
  const [team1, setTeam1]     = useState('Sri Lanka')
  const [team2, setTeam2]     = useState('')
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [generated, setGenerated] = useState(false)

  const generateReport = async () => {
    if (!venue || !team2) { setError('Please select a venue and opponent team'); return }
    setLoading(true); setError(''); setReport(null)
    try {
      const res = await api.get('/reports/prematch', {
        params: { venue_name: venue, team1, team2 }
      })
      setReport(res.data)
      setGenerated(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Please try again.')
    }
    setLoading(false)
  }

  // Build chart data from report
  const phaseData = report?.phase_stats?.map(p => ({
    name: p.phase,
    'Avg Runs':    parseFloat(p.avg_runs?.toFixed(1) || 0),
    'Run Rate':    parseFloat(p.run_rate?.toFixed(2) || 0),
    'Avg Wickets': parseFloat(p.avg_wickets?.toFixed(2) || 0),
  })) || []

  const tossData = report?.venue_stats ? [
    { name: 'Bat First Wins', value: report.venue_stats.bat_first_wins || 0 },
    { name: 'Chase Wins',     value: report.venue_stats.chase_wins || 0 },
  ] : []

  const batterData = (report?.top_batters || []).slice(0, 6).map(b => ({
    name:          b.name.split(' ').slice(-1)[0],
    fullName:      b.name,
    'Strike Rate': parseFloat(b.strike_rate?.toFixed(1) || 0),
    'Average':     parseFloat(b.average?.toFixed(1) || 0),
    'Runs':        b.runs || 0,
  }))

  const bowlerData = (report?.top_bowlers || []).slice(0, 6).map(b => ({
    name:      b.name.split(' ').slice(-1)[0],
    fullName:  b.name,
    'Economy': parseFloat(b.economy?.toFixed(2) || 0),
    'Average': parseFloat(b.average?.toFixed(2) || 0),
    'Wickets': b.wickets || 0,
  }))

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>Pre-Match Report</h1>
          <p style={s.subtitle}>Generate comprehensive analytics and insights before a match</p>
        </div>

        {/* Config Card */}
        <div style={s.configCard}>
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
              <label className="form-label">Team 1 (Sri Lanka)</label>
              <input className="form-control" value="Sri Lanka" disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
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
            {loading ? '⏳ Generating Report...' : '📊 Generate Report'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={s.loadingCard}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Analysing match data...</p>
          </div>
        )}

        {/* Report Content */}
        {report && !loading && (
          <>
            {/* Summary Cards */}
            <div style={s.summaryGrid}>
              <SummaryCard
                icon="🏟️" label="Venue"
                value={report.venue_name || venue}
                sub="Match location"
              />
              <SummaryCard
                icon="📈" label="Avg 1st Innings"
                value={report.venue_stats?.avg_first_innings?.toFixed(0) || '—'}
                sub="runs at this venue"
              />
              <SummaryCard
                icon="🏏" label="Bat First Win %"
                value={`${report.venue_stats?.bat_first_win_pct?.toFixed(0) || '—'}%`}
                sub="matches won batting first"
              />
              <SummaryCard
                icon="🎯" label="Toss Recommendation"
                value={report.toss_recommendation || report.venue_stats?.toss_recommendation || '—'}
                sub="based on historical data"
                highlight
              />
            </div>

            {/* Charts Row 1 */}
            <div style={s.chartsRow}>

              {/* Phase Scoring */}
              <div style={s.chartCard}>
                <h3 style={s.chartTitle}>Phase-wise Scoring Analysis</h3>
                <p style={s.chartSub}>Average runs per phase at {venue}</p>
                {phaseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
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

              {/* Bat First vs Chase */}
              <div style={s.chartCard}>
                <h3 style={s.chartTitle}>Bat First vs Chase</h3>
                <p style={s.chartSub}>Win distribution at {venue}</p>
                {tossData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={tossData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        paddingAngle={4} dataKey="value" label={({ name, percent }) =>
                          `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        <Cell fill={COLORS.batFirst} />
                        <Cell fill={COLORS.chase} />
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div style={s.chartsRow}>

              {/* Top Batters */}
              <div style={s.chartCard}>
                <h3 style={s.chartTitle}>Top SL Batters at Venue</h3>
                <p style={s.chartSub}>Strike rate comparison</p>
                {batterData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={batterData} layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={70}
                        tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle}
                        formatter={(val, name, props) => [val, props.payload.fullName]} />
                      <Bar dataKey="Strike Rate" fill={COLORS.sl} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </div>

              {/* Top Bowlers */}
              <div style={s.chartCard}>
                <h3 style={s.chartTitle}>Top SL Bowlers at Venue</h3>
                <p style={s.chartSub}>Economy rate comparison (lower is better)</p>
                {bowlerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={bowlerData} layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={70}
                        tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle}
                        formatter={(val, name, props) => [val, props.payload.fullName]} />
                      <Bar dataKey="Economy" fill={COLORS.middle} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </div>
            </div>

            {/* Player Tables */}
            <div style={s.chartsRow}>
              <PlayerTable title="Top Batters" players={report.top_batters || []} type="batting" />
              <PlayerTable title="Top Bowlers" players={report.top_bowlers || []} type="bowling" />
            </div>

            {/* Footer */}
            <div style={s.reportFooter}>
              <p>Report generated for <strong>{venue}</strong> — {team1} vs {team2}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Based on historical T20I data from Cricsheet · © {new Date().getFullYear()} CrickSL. All rights reserved.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, sub, highlight }) {
  return (
    <div style={{ ...s.summaryCard, ...(highlight ? s.summaryCardHighlight : {}) }}>
      <div style={s.summaryIcon}>{icon}</div>
      <div style={s.summaryLabel}>{label}</div>
      <div style={{ ...s.summaryValue, color: highlight ? '#f59e0b' : 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={s.summarySub}>{sub}</div>
    </div>
  )
}

function PlayerTable({ title, players, type }) {
  if (!players || players.length === 0) return null
  return (
    <div style={{ ...s.chartCard, flex: 1 }}>
      <h3 style={s.chartTitle}>{title}</h3>
      <table style={s.table}>
        <thead>
          <tr style={s.thead}>
            <th style={s.th}>Player</th>
            <th style={s.th}>Matches</th>
            {type === 'batting' ? (
              <><th style={s.th}>Runs</th><th style={s.th}>Avg</th><th style={s.th}>SR</th></>
            ) : (
              <><th style={s.th}>Wickets</th><th style={s.th}>Avg</th><th style={s.th}>Eco</th></>
            )}
          </tr>
        </thead>
        <tbody>
          {players.slice(0, 6).map((p, i) => (
            <tr key={i} style={s.tr}>
              <td style={s.td}>{p.name}</td>
              <td style={{ ...s.td, textAlign: 'center' }}>{p.matches}</td>
              {type === 'batting' ? (
                <>
                  <td style={{ ...s.td, textAlign: 'center', color: '#f59e0b' }}>{p.runs}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{p.average?.toFixed(1)}</td>
                  <td style={{ ...s.td, textAlign: 'center', color: '#10b981' }}>{p.strike_rate?.toFixed(1)}</td>
                </>
              ) : (
                <>
                  <td style={{ ...s.td, textAlign: 'center', color: '#f59e0b' }}>{p.wickets}</td>
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
      No data available for this venue
    </div>
  )
}

const tooltipStyle = {
  background: '#0f1929', border: '1px solid #1e3a5f',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '0.82rem',
}

const s = {
  page:      { background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1.5rem' },
  container: { maxWidth: '1280px', margin: '0 auto' },
  header:    { marginBottom: '1.75rem' },
  title:     { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle:  { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  configCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem' },
  cardTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' },
  configGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  alertError: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' },
  generateBtn:{ padding: '0.75rem 2rem', fontSize: '0.95rem' },

  loadingCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  spinner:     { width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' },
  summaryCardHighlight: { border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' },
  summaryIcon:  { fontSize: '1.5rem', marginBottom: '0.5rem' },
  summaryLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' },
  summaryValue: { fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', fontFamily: "'Rajdhani', sans-serif" },
  summarySub:   { fontSize: '0.72rem', color: 'var(--text-muted)' },

  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
  chartCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' },
  chartTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  chartSub:   { color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '1.25rem' },

  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'rgba(255,255,255,0.03)' },
  th:    { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  tr:    { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:    { padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)' },

  reportFooter: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' },
}

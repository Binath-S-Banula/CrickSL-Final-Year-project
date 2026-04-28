import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import api from '../api/api'

const ROLES = [
  { key: 'all',        label: 'All Players' },
  { key: 'batter',     label: 'Batters' },
  { key: 'bowler',     label: 'Bowlers' },
  { key: 'allrounder', label: 'All-Rounders' },
  { key: 'keeper',     label: 'Wicket Keepers' },
]

const ERAS = [
  { key: 0,  label: 'All Time' },
  { key: 3,  label: 'Last 3 Years' },
  { key: 5,  label: 'Last 5 Years' },
  { key: 10, label: 'Last 10 Years' },
]

const PIE_COLORS = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6']

const tooltipStyle = {
  background: '#0f1929', border: '1px solid #1e3a5f',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '0.82rem',
}

export default function PlayerDashboard() {
  const [role, setRole]       = useState('all')
  const [years, setYears]     = useState(0)
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState('')
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('batting')

  // Load player list when role or years changes
  useEffect(() => {
    setListLoading(true)
    setSelected('')
    setStats(null)
    api.get('/players/dashboard/list', { params: { role, years } })
      .then(r => setPlayers(r.data))
      .catch(() => setPlayers([]))
      .finally(() => setListLoading(false))
  }, [role, years])

  // Load player stats when selected
  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setStats(null)
    api.get(`/players/dashboard/${encodeURIComponent(selected)}`, { params: { years } })
      .then(r => { setStats(r.data); setActiveTab('batting') })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [selected, years])

  const activePlayers = players.filter(p => p.badge === 'Active')
  const legendPlayers = players.filter(p => p.badge === 'Legend')

  const bat = stats?.batting
  const bowl = stats?.bowling

  const dismissalData = bat ? Object.entries(bat.dismissal_types || {})
    .map(([name, value]) => ({ name: name.replace(/_/g,' '), value }))
    .sort((a,b) => b.value - a.value) : []

  const scoreDistData = bat ? Object.entries(bat.score_distribution || {})
    .map(([name, value]) => ({ name, value })) : []

  const phaseData = bat ? ['powerplay','middle','death'].map(ph => ({
    phase: ph.charAt(0).toUpperCase() + ph.slice(1),
    'Strike Rate': bat.phase_strike_rate?.[ph] || 0,
    'Dismissals': bat.phase_dismissals?.[ph] || 0,
  })) : []

  const bowlPhaseData = bowl ? ['powerplay','middle','death'].map(ph => ({
    phase: ph.charAt(0).toUpperCase() + ph.slice(1),
    'Economy': bowl.phase_economy?.[ph] || 0,
  })).filter(d => d.Economy > 0) : []

  const wicketTypesData = bowl ? Object.entries(bowl.wicket_types || {})
    .map(([name, value]) => ({ name, value })) : []

  const hasbowling = bowl && (bowl.wickets > 0 || bowl.innings > 0)
  const hasBatting = bat && bat.innings > 0

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>Player Analytics</h1>
          <p style={s.subtitle}>Explore performance stats for Sri Lanka T20I players — past and present</p>
        </div>

        {/* Filters */}
        <div style={s.filtersCard}>
          {/* Step 1 — Role */}
          <div style={s.filterSection}>
            <div style={s.filterLabel}>1. Select Role</div>
            <div style={s.btnGroup}>
              {ROLES.map(r => (
                <button key={r.key} style={{ ...s.filterBtn, ...(role === r.key ? s.filterBtnActive : {}) }}
                  onClick={() => setRole(r.key)}>{r.label}</button>
              ))}
            </div>
          </div>

          {/* Step 2 — Era */}
          <div style={s.filterSection}>
            <div style={s.filterLabel}>2. Select Era</div>
            <div style={s.btnGroup}>
              {ERAS.map(e => (
                <button key={e.key} style={{ ...s.filterBtn, ...(years === e.key ? s.filterBtnActive : {}) }}
                  onClick={() => setYears(e.key)}>{e.label}</button>
              ))}
            </div>
          </div>

          {/* Step 3 — Player */}
          <div style={s.filterSection}>
            <div style={s.filterLabel}>3. Select Player</div>
            {listLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading players...</div>
            ) : (
              <select style={s.select} value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">Choose a player...</option>
                {activePlayers.length > 0 && (
                  <optgroup label="⚡ Active Players">
                    {activePlayers.map(p => (
                      <option key={p.name} value={p.name}>{p.name} — {p.role}</option>
                    ))}
                  </optgroup>
                )}
                {legendPlayers.length > 0 && (
                  <optgroup label="🏛 Legends">
                    {legendPlayers.map(p => (
                      <option key={p.name} value={p.name}>{p.name} — {p.role}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
            <div style={s.playerCount}>
              {players.length > 0 && `${activePlayers.length} active · ${legendPlayers.length} legends`}
            </div>
          </div>
        </div>

        {loading && (
          <div style={s.loadingCard}>
            <div style={s.spinner} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading player stats...</p>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Player Identity */}
            <div style={s.identityCard}>
              <div style={s.avatarLarge}>{stats.player_name[0]}</div>
              <div>
                <div style={s.playerName}>{stats.player_name}</div>
                <div style={s.playerMeta}>
                  <span style={stats.badge === 'Active' ? s.badgeActive : s.badgeLegend}>
                    {stats.badge === 'Active' ? '⚡ Active' : '🏛 Legend'}
                  </span>
                  <span style={s.metaItem}>{stats.role}</span>
                  {stats.batting_style && <span style={s.metaItem}>{stats.batting_style}</span>}
                  {stats.bowling_style && <span style={s.metaItem}>{stats.bowling_style}</span>}
                </div>
                {stats.last_active && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Last active: {stats.last_active}
                    {years > 0 ? ` · Showing last ${years} years` : ' · All time data'}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            {hasBatting && hasbowling && (
              <div style={s.tabs}>
                <button style={{ ...s.tab, ...(activeTab === 'batting' ? s.tabActive : {}) }}
                  onClick={() => setActiveTab('batting')}>🏏 Batting Analysis</button>
                <button style={{ ...s.tab, ...(activeTab === 'bowling' ? s.tabActive : {}) }}
                  onClick={() => setActiveTab('bowling')}>🎳 Bowling Analysis</button>
              </div>
            )}

            {/* ─── BATTING SECTION ─── */}
            {(activeTab === 'batting' || !hasbowling) && hasBatting && (
              <>
                {/* Batting Overview */}
                <div style={s.statsGrid}>
                  {[
                    { label: 'Innings', value: bat.innings },
                    { label: 'Total Runs', value: bat.runs, color: '#f59e0b' },
                    { label: 'Average', value: bat.average },
                    { label: 'Strike Rate', value: bat.strike_rate, color: '#10b981' },
                    { label: 'Highest Score', value: bat.highest_score, color: '#f59e0b' },
                    { label: '50s / 100s', value: `${bat.fifties} / ${bat.hundreds}` },
                  ].map(c => (
                    <div key={c.label} style={s.statCard}>
                      <div style={{ ...s.statValue, color: c.color || 'var(--text-primary)' }}>{c.value}</div>
                      <div style={s.statLabel}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Fault Analysis */}
                <div style={s.faultCard}>
                  <h3 style={s.cardTitle}>⚠️ Fault Analysis</h3>
                  <div style={s.faultGrid}>
                    <div style={s.faultItem}>
                      <div style={s.faultValue}>{bat.ducks}</div>
                      <div style={s.faultLabel}>Ducks</div>
                      <div style={s.faultPct}>{bat.duck_pct}% of innings</div>
                    </div>
                    <div style={s.faultItem}>
                      <div style={s.faultValue}>{bat.golden_ducks}</div>
                      <div style={s.faultLabel}>Golden Ducks</div>
                      <div style={s.faultPct}>Out first ball</div>
                    </div>
                    <div style={s.faultItem}>
                      <div style={s.faultValue}>{bat.dot_pct}%</div>
                      <div style={s.faultLabel}>Dot Ball %</div>
                      <div style={s.faultPct}>Balls with no score</div>
                    </div>
                    <div style={s.faultItem}>
                      <div style={{ ...s.faultValue, color: '#10b981' }}>{bat.boundary_pct}%</div>
                      <div style={s.faultLabel}>Boundary %</div>
                      <div style={s.faultPct}>Balls hit for 4 or 6</div>
                    </div>
                    <div style={s.faultItem}>
                      <div style={{ ...s.faultValue, color: '#f59e0b' }}>
                        {Object.entries(bat.dismissal_types || {}).sort((a,b)=>b[1]-a[1])[0]?.[0]?.replace(/_/g,' ') || '—'}
                      </div>
                      <div style={s.faultLabel}>Most Common Dismissal</div>
                      <div style={s.faultPct}>How they get out most</div>
                    </div>
                    <div style={s.faultItem}>
                      <div style={{ ...s.faultValue, color: '#ef4444' }}>
                        {Object.entries(bat.phase_dismissals || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'}
                      </div>
                      <div style={s.faultLabel}>Most Vulnerable Phase</div>
                      <div style={s.faultPct}>Phase with most dismissals</div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div style={s.chartsRow}>
                  {/* Dismissal breakdown */}
                  <div style={s.chartCard}>
                    <h3 style={s.cardTitle}>Dismissal Breakdown</h3>
                    <p style={s.chartSub}>How the player gets dismissed</p>
                    {dismissalData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={dismissalData} cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={3} dataKey="value"
                            label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
                            labelLine={false}>
                            {dismissalData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <NoData />}
                  </div>

                  {/* Score distribution */}
                  <div style={s.chartCard}>
                    <h3 style={s.cardTitle}>Score Distribution</h3>
                    <p style={s.chartSub}>Runs scored per innings frequency</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={scoreDistData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" name="Innings" radius={[4,4,0,0]}>
                          {scoreDistData.map((entry, i) => (
                            <Cell key={i} fill={entry.name === '0' ? '#ef4444' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Phase Performance */}
                <div style={s.chartCard}>
                  <h3 style={s.cardTitle}>Phase Performance — Batting</h3>
                  <p style={s.chartSub}>Strike rate and dismissals by match phase</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={phaseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="phase" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{v}</span>} />
                      <Bar dataKey="Strike Rate" fill="#f59e0b" radius={[4,4,0,0]} />
                      <Bar dataKey="Dismissals" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ─── BOWLING SECTION ─── */}
            {(activeTab === 'bowling' || !hasBatting) && hasbowling && (
              <>
                {/* Bowling Overview */}
                <div style={s.statsGrid}>
                  {[
                    { label: 'Wickets', value: bowl.wickets, color: '#f59e0b' },
                    { label: 'Economy', value: bowl.economy, color: bowl.economy < 8 ? '#10b981' : '#ef4444' },
                    { label: 'Average', value: bowl.average || '—' },
                    { label: 'Bowling SR', value: bowl.strike_rate || '—' },
                    { label: 'Dot Ball %', value: `${bowl.dot_pct}%`, color: '#3b82f6' },
                    { label: 'Innings Bowled', value: bowl.innings },
                  ].map(c => (
                    <div key={c.label} style={s.statCard}>
                      <div style={{ ...s.statValue, color: c.color || 'var(--text-primary)' }}>{c.value}</div>
                      <div style={s.statLabel}>{c.label}</div>
                    </div>
                  ))}
                </div>

                <div style={s.chartsRow}>
                  {/* Wicket types */}
                  <div style={s.chartCard}>
                    <h3 style={s.cardTitle}>Wicket Types</h3>
                    <p style={s.chartSub}>How the player takes wickets</p>
                    {wicketTypesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={wicketTypesData} cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={3} dataKey="value"
                            label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
                            labelLine={false}>
                            {wicketTypesData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <NoData />}
                  </div>

                  {/* Phase economy */}
                  <div style={s.chartCard}>
                    <h3 style={s.cardTitle}>Phase Economy Rate</h3>
                    <p style={s.chartSub}>Economy by phase (lower is better)</p>
                    {bowlPhaseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={bowlPhaseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="phase" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="Economy" fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <NoData />}
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div style={s.reportFooter}>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {stats.player_name} · T20I Career Statistics
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {years > 0 ? `Last ${years} years of data` : 'All-time career data'} · Based on Cricsheet T20I dataset ·
                © {new Date().getFullYear()} CrickSL. All rights reserved.
              </p>
            </div>
          </>
        )}

        {!stats && !loading && selected && (
          <div style={s.loadingCard}>
            <p style={{ color: 'var(--text-muted)' }}>No data found for this player in the selected period.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NoData() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      No data available
    </div>
  )
}

const s = {
  page:       { background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1.5rem' },
  container:  { maxWidth: '1280px', margin: '0 auto' },
  header:     { marginBottom: '1.75rem' },
  title:      { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle:   { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  filtersCard:    { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  filterSection:  { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  filterLabel:    { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '100px' },
  btnGroup:       { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  filterBtn:      { padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500, transition: 'all 0.15s' },
  filterBtnActive:{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' },
  select:         { padding: '0.6rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: '300px', outline: 'none' },
  playerCount:    { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' },

  loadingCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  spinner:      { width: '38px', height: '38px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  identityCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' },
  avatarLarge:  { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fbbf24', fontSize: '1.5rem', flexShrink: 0 },
  playerName:   { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' },
  playerMeta:   { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  badgeActive:  { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
  badgeLegend:  { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
  metaItem:     { fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' },

  tabs:         { display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem', maxWidth: '400px' },
  tab:          { flex: 1, padding: '0.6rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, background: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.18s' },
  tabActive:    { background: 'var(--bg-secondary)', color: '#f59e0b', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' },

  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' },
  statValue:    { fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", marginBottom: '0.25rem' },
  statLabel:    { fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },

  faultCard:    { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  faultGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' },
  faultItem:    { textAlign: 'center' },
  faultValue:   { fontSize: '1.4rem', fontWeight: 700, color: '#ef4444', fontFamily: "'Rajdhani', sans-serif", marginBottom: '0.2rem' },
  faultLabel:   { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.15rem' },
  faultPct:     { fontSize: '0.7rem', color: 'var(--text-muted)' },

  chartsRow:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
  chartCard:    { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' },
  cardTitle:    { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  chartSub:     { color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '1.25rem' },

  reportFooter: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' },
}

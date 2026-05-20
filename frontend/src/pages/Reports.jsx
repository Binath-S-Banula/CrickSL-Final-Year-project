import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

// ══════════════════════════════════════════════════════════════════
//  STRATEGY GENERATOR — reads prediction + report, produces cards
// ══════════════════════════════════════════════════════════════════
function generateStrategies(prediction, report, tossDecision, tossWinner, team2) {
  const cards = []
  const slProb  = prediction?.sl_win_probability || 0
  const factors = (prediction?.key_factors || []).join(' ').toLowerCase()
  const isFavoured     = slProb >= 50
  const slBattingFirst = tossWinner === 'Sri Lanka'
    ? tossDecision === 'bat'
    : tossDecision === 'field'

  const venueAvg   = report?.venue_stats?.avg_first_innings_score || 150
  const batFirstPct = report?.venue_stats?.bat_first_wins
    ? (report.venue_stats.bat_first_wins /
       (report.venue_stats.bat_first_wins + (report.venue_stats.chase_wins || 0))) * 100
    : 50
  const chasePct = 100 - batFirstPct

  const dewHigh    = factors.includes('dew risk is high') || factors.includes('dew risk is extreme')
  const dewMedium  = factors.includes('dew risk is medium')
  const poorForm   = factors.includes('opponent in better recent form')
  const goodForm   = factors.includes('sri lanka in better recent form')
  const poorH2H    = factors.includes('historical edge over sri lanka')
  const goodH2H    = factors.includes('strong head-to-head record')
  const opponentToss = tossWinner !== 'Sri Lanka'

  // ── CARD 1: Probability-based headline ──────────────────────────
  if (slProb < 35) {
    cards.push({
      type: 'critical',
      icon: '🚨',
      title: 'Underdog Position — Aggressive Strategy Required',
      bullets: [
        'Attack from ball one — a conservative approach will not be enough to upset this opponent',
        'Set the tone early: take wickets in the powerplay or score above run-a-ball from over 1',
        'Pick your best match-winner and give them maximum responsibility regardless of conditions',
        'One big over or one early breakthrough completely resets the match — stay patient until that moment',
      ],
      motivation: '"Underdogs win through belief and execution — the scoreboard does not matter until the last ball."',
    })
  } else if (slProb < 50) {
    cards.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Slight Underdog — Smart Execution Can Close the Gap',
      bullets: [
        'Avoid giving away momentum early — no loose overs in powerplay bowling or reckless batting',
        'Stick to your strengths: bowl to your field, bat to your role, and trust your preparation',
        'Keep run rate or required rate manageable through the middle overs — do not panic',
        'Match pressure builds over 20 overs — stay composed and let the match come to you',
      ],
      motivation: '"T20 is 20 overs. You are never out of it until the last ball is bowled."',
    })
  } else if (slProb < 65) {
    cards.push({
      type: 'positive',
      icon: '✅',
      title: 'Slight Favourite — Maintain Discipline and Avoid Complacency',
      bullets: [
        'Do not let the advantage create complacency — respect this opponent regardless of probability',
        'Execute your game plan for all 20 overs — a five-over lapse can flip a T20 completely',
        'Rotate strike consistently and avoid unnecessary risks in the middle overs',
        'Back your bowlers to defend any total above venue par — trust the plan',
      ],
      motivation: '"Pressure is a privilege — only good teams face must-protect situations."',
    })
  } else {
    cards.push({
      type: 'positive',
      icon: '🏆',
      title: 'Strong Favourite — Dominate Early and Close Out Professionally',
      bullets: [
        'Set the tone from over one — a dominant powerplay makes the match one-sided early',
        'Do not give this opponent a sniff: if batting first, post 185+; if chasing, get to 60+ in powerplay',
        'Rotate bowlers carefully — do not exhaust your best death bowler before over 16',
        'Stay switched on for the full 40 overs — T20 history shows upsets happen to complacent favourites',
      ],
      motivation: '"Champions are defined by how they perform when they are expected to win."',
    })
  }

  // ── CARD 2: Dew risk strategy ─────────────────────────────────
  if (dewHigh && slBattingFirst) {
    cards.push({
      type: 'critical',
      icon: '💧',
      title: 'High Dew Alert — Batting First Disadvantage',
      bullets: [
        `Set a target of at least ${Math.round(venueAvg + 20)} or above — dew will help the chasing team significantly`,
        'Use your spinners heavily in overs 7-15 while the ball is still dry — dew destroys grip by over 16',
        'Save your best yorker bowlers for death overs 16-20 when dew is heaviest and spin is ineffective',
        'In the field, keep your strongest fielders at long-on and long-off — wet outfield means more boundaries',
        'Brief your seamers: bowl fuller lengths with dew — short-pitched deliveries will skid through unpredictably',
      ],
      motivation: '"Dew is a condition, not an excuse — plan your bowling attack around it from over one."',
    })
  } else if (dewHigh && !slBattingFirst) {
    cards.push({
      type: 'positive',
      icon: '💧',
      title: 'High Dew — Chasing Conditions Favour Sri Lanka',
      bullets: [
        'Exploit the dew advantage: SL bowlers in the first innings have a better grip — bowl tight lines',
        'Keep the score below venue average in the first innings — dew will make chasing easier',
        `Chase target: get to ${Math.round(venueAvg * 0.5)} or above by over 10 to stay ahead of required rate`,
        'Assign your most consistent death bowler to overs 17-20 while dew makes conditions slippery for opponents',
        'Communicate field placements clearly — wet ball can slip during throws, preventing unnecessary boundaries',
      ],
      motivation: '"Conditions are in your favour — execute the plan and the result will follow."',
    })
  } else if (dewMedium) {
    cards.push({
      type: 'warning',
      icon: '💧',
      title: 'Moderate Dew Expected — Monitor and Adapt',
      bullets: [
        'Check ball condition every 4-5 overs — medium dew can develop into heavy dew by over 15',
        'Keep a spinner ready as backup in death overs if dew prevents normal seam movement',
        'Wipe the ball at every opportunity — fielders must be proactive in keeping it dry',
      ],
      motivation: '"Adaptability is the most underrated skill in T20 cricket."',
    })
  }

  // ── CARD 3: Venue-based batting/bowling strategy ──────────────
  if (slBattingFirst && chasePct > 55) {
    cards.push({
      type: 'warning',
      icon: '🏟️',
      title: `Venue Favours Chasing (${Math.round(chasePct)}% chase wins) — Bat With Intent`,
      bullets: [
        `Chase-win percentage at this venue is ${Math.round(chasePct)}% — batting first requires an above-par score`,
        `Minimum target to defend: ${Math.round(venueAvg + 15)} — anything below gives the opponent a comfortable chase`,
        'Be aggressive from ball one — do not give away 2-3 overs getting your eye in at a chase-friendly venue',
        'Use your best power hitter at No.4 ready from over 6 — the middle overs are critical batting windows here',
        'Bowling: attack with your best spinner in overs 7-10 — middle overs are where this venue is defended',
      ],
      motivation: '"When the venue works against you, your scoring rate must work for you."',
    })
  } else if (!slBattingFirst && batFirstPct > 55) {
    cards.push({
      type: 'warning',
      icon: '🏟️',
      title: `Venue Favours Batting First (${Math.round(batFirstPct)}% bat-first wins) — Chase Smartly`,
      bullets: [
        `This venue sees ${Math.round(batFirstPct)}% of matches won by the team batting first — do not let the chase drift`,
        'Powerplay target: get to 55+ without losing more than 2 wickets — a slow start here is very hard to recover',
        'Do not allow required rate to exceed 10 after over 12 — this venue historically punishes slow middle overs',
        `Identify the opposition weakest bowler and target them in overs 13-16 for maximum boundary opportunities`,,
        'Keep your best finisher (Hasaranga or Asalanka) for the death — do not send them in early under pressure',
      ],
      motivation: '"Chasing is a mindset. Attack early, breathe late."',
    })
  } else {
    cards.push({
      type: 'neutral',
      icon: '🏟️',
      title: 'Balanced Venue — Execution Decides the Match',
      bullets: [
        `Venue average first innings score is ${Math.round(venueAvg)} — use this as your par score benchmark`,
        'Both batting first and chasing are viable — match result comes down to powerplay execution',
        'Focus on building partnerships rather than individual brilliance — this venue rewards team batting',
        'Bowling: vary pace and length throughout — this pitch does not strongly favour pace or spin',
      ],
      motivation: '"On a balanced pitch, the team with more discipline always wins."',
    })
  }

  // ── CARD 4: Form-based advice ─────────────────────────────────
  if (poorForm) {
    cards.push({
      type: 'warning',
      icon: '📈',
      title: 'Opponent in Better Form — Break Their Momentum Early',
      bullets: [
        'A team in form feeds on confidence — one early wicket or a tight first over can disrupt their rhythm completely',
        'Bowl to your plans, not to the scoreboard — in-form teams want you to panic and overpitch',
        'Study their last 3 innings specifically: what dismissals? What bowling style worked? Replicate it',
        'Batting: do not let their bowling form intimidate — pick your moments and strike hard when the loose ball comes',
        'Team huddle focus: "Their form is their past — our execution starts now"',
      ],
      motivation: '"Form is temporary. Your skills in this moment are permanent."',
    })
  } else if (goodForm) {
    cards.push({
      type: 'positive',
      icon: '📈',
      title: 'SL in Strong Form — Carry That Momentum In',
      bullets: [
        'Form gives confidence but form does not win matches — stay grounded and execute the plan',
        'Use your recent performance as proof of what you can do, not as a reason to relax',
        'Continue doing what has been working in recent matches — do not change a winning formula',
        'Maintain the intensity from training — form disappears quickly when concentration drops',
      ],
      motivation: '"Momentum is the most powerful force in T20 cricket — protect it."',
    })
  }

  // ── CARD 5: Head-to-head advice ───────────────────────────────
  if (poorH2H) {
    cards.push({
      type: 'critical',
      icon: '⚔️',
      title: `Poor H2H Record vs ${team2} — Specific Preparation Required`,
      bullets: [
        `Study ${team2} last 5 matches against SL — identify the specific patterns that have beaten SL before`,
        'Their key match-winner has historically dominated SL — assign your best bowler to that player from over 1',
        'If their opening pair has strong H2H: take the new ball strategy seriously, attack early rather than build pressure',
        'Change at least one tactical element from previous matches — doing the same thing expecting different results will not work',
        'Pre-match: talk through the H2H record honestly with the team, then put it aside and focus on THIS match',
      ],
      motivation: '"History does not play cricket. Only you play cricket — and today is a new match."',
    })
  } else if (goodH2H) {
    cards.push({
      type: 'positive',
      icon: '⚔️',
      title: `Strong H2H vs ${team2} — Use the Psychological Advantage`,
      bullets: [
        'Your H2H record shows this opponent has been managed well before — trust the patterns that have worked',
        'Revisit previous successful match plans against this team and identify which bowlers and match-ups were most effective',
        'Use the psychological edge — this team knows you have beaten them before, play with that confidence',
        'However: they will have prepared specifically for SL this time, so expect tactical variations from them',
      ],
      motivation: '"A good H2H record is earned through hard work — now earn this one."',
    })
  }

  // ── CARD 6: Toss disadvantage ─────────────────────────────────
  if (opponentToss) {
    cards.push({
      type: 'warning',
      icon: '🪙',
      title: 'Opponent Controlled Toss — Adapt to Conditions Quickly',
      bullets: [
        'The opponent has chosen the optimal conditions — you must adapt your game plan within the first 3 overs',
        slBattingFirst
          ? 'Forced to bat first: set an above-venue-average total — give your bowlers something to defend'
          : 'Forced to chase: do not let required rate go above 9 after over 10 — attack the powerplay hard',
        'Use fielding warm-ups to read the pitch: moisture, pace, turn — brief your captain in the first over',
        'Losing the toss is not losing the match — T20 history shows 46% of toss-losers still win',
      ],
      motivation: '"The toss decided conditions, not the result. You decide the result."',
    })
  }

  // ── CARD 7: Always show — mental strength ────────────────────
  cards.push({
    type: 'mental',
    icon: '🧠',
    title: 'Mental Strength — The Invisible X Factor',
    bullets: [
      'Breathe between deliveries — a 3-second reset prevents panic decisions in high-pressure moments',
      'If wickets fall early: the next partnership is the most important one, not the ones already lost',
      'If bowling goes expensive: the next over is the only one that matters — forget the previous ones',
      'Talk to each other in the field — communication prevents the silent spiral that collapses T20 innings',
      '"Back your skills" — you have practiced this situation thousands of times in the nets',
    ],
    motivation: '"The difference between a good team and a great team is what happens in the hard moments."',
  })

  return cards
}

// ══════════════════════════════════════════════════════════════════

export default function Reports() {
  const [venue, setVenue]           = useState('')
  const [team2, setTeam2]           = useState('')
  const [tossWinner, setTossWinner] = useState('Sri Lanka')
  const [tossDecision, setTossDecision] = useState('bat')
  const [report, setReport]         = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [predLoading, setPredLoading] = useState(false)
  const [error, setError]           = useState('')
  const [venues, setVenues]         = useState([])
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
  }))

  const tossData = report?.venue_stats ? [
    { name: 'Bat First Wins', value: report.venue_stats.bat_first_wins || 0 },
    { name: 'Chase Wins',     value: report.venue_stats.chase_wins || 0 },
  ] : []

  const batterChart = activeBatters.slice(0, 6).map(b => ({
    name: b.name.split(' ').slice(-1)[0], fullName: b.name,
    'Strike Rate': parseFloat((b.strike_rate || 0).toFixed(1)),
  }))

  const bowlerChart = activeBowlers.slice(0, 6).map(b => ({
    name: b.name.split(' ').slice(-1)[0], fullName: b.name,
    'Economy': parseFloat((b.economy || 0).toFixed(2)),
  }))

  const slProb    = prediction?.sl_win_probability || 0
  const oppProb   = prediction?.opponent_win_probability || 0
  const isFavoured = slProb >= 50

  const strategies = prediction && !prediction.error
    ? generateStrategies(prediction, report, tossDecision, tossWinner, team2)
    : []

  const strategyColors = {
    critical: { bg: 'rgba(239,68,68,0.08)`,   border: `rgba(239,68,68,0.25)',   icon: '#ef4444', bar: '#ef4444' },
    warning:  { bg: 'rgba(245,158,11,0.08)`,  border: `rgba(245,158,11,0.25)',  icon: '#f59e0b', bar: '#f59e0b' },
    positive: { bg: 'rgba(16,185,129,0.08)`,  border: `rgba(16,185,129,0.25)', icon: '#10b981', bar: '#10b981' },
    neutral:  { bg: 'rgba(99,102,241,0.08)`,  border: `rgba(99,102,241,0.25)', icon: '#818cf8', bar: '#818cf8' },
    mental:   { bg: 'rgba(168,85,247,0.08)`,  border: `rgba(168,85,247,0.25)', icon: '#c084fc', bar: '#c084fc' },
  }

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .pred-card  { animation: fadeIn 0.45s ease forwards; }
        .strat-card { animation: fadeIn 0.5s ease forwards; }
        .prob-bar-fill { transition: width 1.3s cubic-bezier(.4,0,.2,1); }
        @media print {
          .no-print { display:none !important; }
          .navbar   { display:none !important; }
          body { background:white !important; color:black !important; }
        }
      `}</style>

      <div style={s.page}>
        <div style={s.container}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Pre-Match Report</h1>
              <p style={s.subtitle}>Analytics · ML Win Prediction · Match Strategies</p>
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

              {report.player_data_years > 3 && (
                <div style={s.dataWarning}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#fbbf24', fontSize: '0.88rem' }}>Limited Recent Match Data</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      Player stats based on the last <strong style={{ color: '#fbbf24' }}>{report.player_data_years} years</strong>.
                      Update the dataset for most current analysis.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ML PREDICTION SECTION ───────────────────────── */}
              {showPredConfig && (
                <div style={s.mlSection} className="no-print">
                  <div style={s.mlSectionHeader}>
                    <div>
                      <h2 style={s.mlSectionTitle}>🤖 ML Win Probability Prediction</h2>
                      <p style={s.mlSectionSub}>
                        Random Forest classifier ·{' '}
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>4,991 T20I matches</span>
                        {' '}· 72.7% accuracy · 10 features
                      </p>
                    </div>
                    <span style={s.mlBadge}>Random Forest v2.0</span>
                  </div>

                  <div style={s.predInputRow}>
                    <div style={s.predInputGroup}>
                      <label style={s.predLabel}>Toss Winner</label>
                      <select style={s.predSelect} value={tossWinner}
                        onChange={e => setTossWinner(e.target.value)}>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value={team2}>{team2}</option>
                      </select>
                    </div>
                    <div style={s.predInputGroup}>
                      <label style={s.predLabel}>Toss Decision</label>
                      <select style={s.predSelect} value={tossDecision}
                        onChange={e => setTossDecision(e.target.value)}>
                        <option value="bat">Bat First</option>
                        <option value="field">Field First (Chase)</option>
                      </select>
                    </div>
                    <button style={s.predBtn} onClick={runPrediction} disabled={predLoading}>
                      {predLoading ? '⏳ Predicting...' : '🎯 Predict Win Probability'}
                    </button>
                  </div>

                  {prediction && !prediction.error && (
                    <div style={s.predResult} className="pred-card">
                      {/* Probability display */}
                      <div style={s.probRow}>
                        <div style={{ ...s.probTeam, ...(isFavoured ? s.probTeamWinner : {}) }}>
                          <div style={s.probFlag}>🇱🇰</div>
                          <div style={s.probTeamName}>Sri Lanka</div>
                          <div style={{ ...s.probValue, color: isFavoured ? '#10b981' : '#94a3b8' }}>
                            {slProb}%
                          </div>
                          {isFavoured && <div style={s.favouredBadge}>FAVOURED ✓</div>}
                        </div>
                        <div style={s.vsDivider}>
                          <div style={s.vsText}>VS</div>
                          <div style={s.vsSubtext}>Win Probability</div>
                        </div>
                        <div style={{ ...s.probTeam, ...(!isFavoured ? s.probTeamWinnerRed : {}) }}>
                          <div style={s.probFlag}>🏏</div>
                          <div style={s.probTeamName}>{team2}</div>
                          <div style={{ ...s.probValue, color: !isFavoured ? '#ef4444' : '#94a3b8' }}>
                            {oppProb}%
                          </div>
                          {!isFavoured && (
                            <div style={{ ...s.favouredBadge, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                              FAVOURED ✓
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bars */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        {[
                          { label: '🇱🇰 Sri Lanka', pct: slProb,  favoured: isFavoured,  colorY: '#10b981', colorN: '#64748b' },
                          { label: `🏏 ${team2}`,   pct: oppProb, favoured: !isFavoured, colorY: '#ef4444', colorN: '#64748b' },
                        ].map((bar, i) => (
                          <div key={i} style={s.probBarRow}>
                            <span style={s.probBarLabel}>{bar.label}</span>
                            <div style={s.probBarTrack}>
                              <div className="prob-bar-fill" style={{
                                ...s.probBarFill, width: `${bar.pct}%`,
                                background: bar.favoured
                                  ? `linear-gradient(90deg, ${bar.colorY}, ${bar.colorY}aa)`
                                  : `linear-gradient(90deg, ${bar.colorN}, ${bar.colorN}aa)`,
                              }} />
                            </div>
                            <span style={s.probBarPct}>{bar.pct}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div style={{
                        ...s.recommendationBanner,
                        background: isFavoured
                          ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))'
                          : 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))',
                        border: `1px solid ${isFavoured ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>{isFavoured ? '✅' : '⚠️'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem',
                            color: isFavoured ? '#10b981' : '#ef4444' }}>
                            {prediction.recommendation}
                          </div>
                          <div style={{ fontSize: '0.78rem`, color: `var(--text-secondary)', marginTop: '0.2rem' }}>
                            Model: Random Forest · Accuracy: 72.7% · Features: 10 · Training: 4,991 matches
                          </div>
                        </div>
                      </div>

                      {/* Key factors */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={s.factorsTitle}>📋 Key Prediction Factors</h4>
                        <p style={s.factorsSub}>The 10 features the Random Forest model weighted to produce this prediction</p>
                        <div style={s.factorsList}>
                          {(prediction.key_factors || []).map((factor, i) => (
                            <div key={i} style={s.factorItem}>
                              <span style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: '0.05rem' }}>
                                {factor.includes('form') ? '📈'
                                  : factor.includes('ew') ? '💧'
                                  : factor.includes('oss') ? '🪙'
                                  : factor.includes('head') || factor.includes('H2H') ? '⚔️'
                                  : '📊'}
                              </span>
                              <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Model info */}
                      <div style={s.modelInfo}>
                        {[
                          ['Algorithm', 'Random Forest (scikit-learn)'],
                          ['Training Data', '4,991 T20I · Cricsheet'],
                          ['Test Accuracy', '72.7%'],
                          ['Features', '10 (venue, form, toss, dew, H2H)'],
                          ['Validation', '80/20 split · 5-fold CV'],
                          ['Model File', 'backend/ml/win_model.pkl'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                            <span style={{ fontSize: '0.82rem', color: label === 'Test Accuracy' ? '#f59e0b' : 'var(--text-secondary)', fontWeight: label === 'Test Accuracy' ? 700 : 500 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction?.error && (
                    <div style={{ ...s.alertError, marginTop: '1rem' }}>⚠️ {prediction.error}</div>
                  )}
                </div>
              )}

              {/* ── MATCH STRATEGIES SECTION ─────────────────────── */}
              {strategies.length > 0 && (
                <div style={s.stratSection}>
                  <div style={s.stratHeader}>
                    <div>
                      <h2 style={s.stratTitle}>
                        {isFavoured ? '🏆 Match Winning Plan' : '🔄 Match Turnaround Strategies'}
                      </h2>
                      <p style={s.stratSub}>
                        {isFavoured
                          ? 'Tactical advice to maintain and extend the advantage — based on match conditions and prediction factors'
                          : 'Specific actions Sri Lanka can take to improve their chances — generated from prediction factors, venue data, and dew conditions'}
                      </p>
                    </div>
                    <div style={s.stratBadge}>
                      {strategies.length} strategy cards
                    </div>
                  </div>

                  <div style={s.stratGrid}>
                    {strategies.map((card, idx) => {
                      const col = strategyColors[card.type] || strategyColors.neutral
                      return (
                        <div key={idx} className="strat-card"
                          style={{ ...s.stratCard, background: col.bg, border: `1px solid ${col.border}`,
                            animationDelay: `${idx * 0.08}s` }}>
                          <div style={s.stratCardHeader}>
                            <div style={{ ...s.stratColorBar, background: col.bar }} />
                            <span style={{ fontSize: '1.3rem' }}>{card.icon}</span>
                            <h3 style={{ ...s.stratCardTitle, color: col.icon }}>{card.title}</h3>
                          </div>
                          <ul style={s.stratBullets}>
                            {card.bullets.map((b, i) => (
                              <li key={i} style={s.stratBullet}>
                                <span style={{ ...s.stratDot, background: col.bar }} />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                          <div style={{ ...s.stratMotivation, borderColor: col.border, color: col.icon }}>
                            {card.motivation}
                          </div>
                        </div>
                      )
                    })}
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
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [v, p.payload.fullName]} />
                        <Bar dataKey="Strike Rate" fill={COLORS.death} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <NoData />}
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
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [v, p.payload.fullName]} />
                        <Bar dataKey="Economy" fill={COLORS.middle} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <NoData />}
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
                  Based on historical T20I data · ML: Random Forest 72.7% · Strategies generated from prediction factors
                  · © {new Date().getFullYear()} CrickSL
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
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: highlight ? '#f59e0b' : 'var(--text-primary)', marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function PlayerTable({ title, players, type }) {
  if (!players || players.length === 0) return (
    <div style={{ ...s.chartCard, flex: 1 }}>
      <h3 style={s.chartTitle}>{title}</h3>
      <div style={{ padding: '2rem`, textAlign: `center`, color: `var(--text-muted)', fontSize: '0.85rem' }}>
        No current squad data available at this venue
      </div>
    </div>
  )
  return (
    <div style={{ ...s.chartCard, flex: 1 }}>
      <h3 style={s.chartTitle}>{title}</h3>
      <table style={{ width: '100%`, borderCollapse: `collapse' }}>
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
      height: 200, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</div>
  )
}

const s = {
  page:        { background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1.5rem' },
  container:   { maxWidth: '1280px', margin: '0 auto' },
  header:      { display: 'flex`, alignItems: `center`, justifyContent: `space-between', marginBottom: '1.75rem`, flexWrap: `wrap', gap: '1rem' },
  title:       { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem`, fontWeight: 700, color: `var(--text-primary)', marginBottom: '0.25rem' },
  subtitle:    { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  printBtn:    { padding: '0.65rem 1.5rem', fontSize: '0.9rem`, whiteSpace: `nowrap' },
  configCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem' },
  cardTitle:   { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem`, fontWeight: 600, color: `var(--text-primary)', marginBottom: '1.25rem' },
  configGrid:  { display: 'grid`, gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  alertError:  { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' },
  generateBtn: { padding: '0.75rem 2rem', fontSize: '0.95rem' },
  loadingCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem`, display: `flex`, flexDirection: `column`, alignItems: `center', gap: '1rem', marginBottom: '1.5rem' },
  spinner:     { width: '38px', height: '38px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%`, animation: `spin 0.8s linear infinite' },
  summaryGrid: { display: 'grid`, gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem`, textAlign: `center' },
  summaryHighlight: { border: '1px solid rgba(245,158,11,0.3)`, background: `rgba(245,158,11,0.05)' },
  dataWarning: { display: 'flex', gap: '0.85rem`, alignItems: `flex-start`, background: `rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  chartsRow:   { display: 'grid`, gridTemplateColumns: `repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
  chartCard:   { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' },
  chartTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem`, fontWeight: 600, color: `var(--text-primary)', marginBottom: '0.25rem' },
  chartSub:    { color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '1.25rem' },
  th:          { padding: '0.65rem 0.75rem`, textAlign: `left', fontSize: '0.72rem`, fontWeight: 600, color: `var(--text-secondary)`, textTransform: `uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  td:          { padding: '0.7rem 0.75rem', fontSize: '0.85rem`, color: `var(--text-primary)' },
  reportFooter:{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem`, textAlign: `center`, color: `var(--text-secondary)', fontSize: '0.85rem' },
  // ML section
  mlSection:      { background: 'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(59,130,246,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' },
  mlSectionHeader:{ display: 'flex`, justifyContent: `space-between`, alignItems: `flex-start', marginBottom: '1.25rem`, flexWrap: `wrap', gap: '0.75rem' },
  mlSectionTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem`, fontWeight: 700, color: `var(--text-primary)', marginBottom: '0.25rem' },
  mlSectionSub:   { color: 'var(--text-secondary)', fontSize: '0.83rem' },
  mlBadge:        { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.75rem`, fontWeight: 600, whiteSpace: `nowrap' },
  predInputRow:   { display: 'flex', gap: '1rem`, alignItems: `flex-end`, flexWrap: `wrap', marginBottom: '1.25rem' },
  predInputGroup: { display: 'flex`, flexDirection: `column', gap: '0.4rem', minWidth: '160px' },
  predLabel:      { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  predSelect:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px`, color: `var(--text-primary)', padding: '0.55rem 0.85rem', fontSize: '0.88rem`, cursor: `pointer' },
  predBtn:        { background: 'linear-gradient(135deg,#10b981,#059669)`, color: `white`, border: `none', borderRadius: '8px', padding: '0.6rem 1.4rem', fontSize: '0.9rem`, fontWeight: 600, cursor: `pointer`, whiteSpace: `nowrap' },
  predResult:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '0.5rem' },
  probRow:        { display: 'flex`, alignItems: `center`, justifyContent: `space-around', gap: '1rem', marginBottom: '1.5rem`, flexWrap: `wrap' },
  probTeam:       { textAlign: 'center', flex: 1, minWidth: '120px', padding: '1rem', borderRadius: '12px`, background: `rgba(255,255,255,0.02)' },
  probTeamWinner: { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' },
  probTeamWinnerRed: { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' },
  probFlag:       { fontSize: '2.2rem', marginBottom: '0.4rem' },
  probTeamName:   { fontSize: '0.88rem`, fontWeight: 600, color: `var(--text-secondary)', marginBottom: '0.5rem' },
  probValue:      { fontFamily: "'Rajdhani', sans-serif", fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.5rem' },
  favouredBadge:  { display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.7rem', fontWeight: 700 },
  vsDivider:      { textAlign: 'center', padding: '0 1rem' },
  vsText:         { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem`, fontWeight: 800, color: `var(--text-muted)' },
  vsSubtext:      { fontSize: '0.7rem`, color: `var(--text-muted)', marginTop: '0.25rem' },
  probBarRow:     { display: 'flex`, alignItems: `center', gap: '0.75rem', marginBottom: '0.6rem' },
  probBarLabel:   { fontSize: '0.82rem`, color: `var(--text-secondary)', minWidth: '110px' },
  probBarTrack:   { flex: 1, height: '10px`, background: `rgba(255,255,255,0.07)', borderRadius: '5px`, overflow: `hidden' },
  probBarFill:    { height: '100%', borderRadius: '5px' },
  probBarPct:     { fontSize: '0.82rem`, fontWeight: 700, color: `var(--text-primary)', minWidth: '40px`, textAlign: `right' },
  recommendationBanner: { display: 'flex`, alignItems: `center', gap: '1rem', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  factorsTitle:   { fontSize: '0.92rem`, fontWeight: 700, color: `var(--text-primary)', marginBottom: '0.3rem' },
  factorsSub:     { fontSize: '0.75rem`, color: `var(--text-muted)', marginBottom: '0.85rem' },
  factorsList:    { display: 'grid`, gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' },
  factorItem:     { display: 'flex`, alignItems: `flex-start', gap: '0.6rem`, background: `rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.85rem', border: '1px solid rgba(255,255,255,0.05)' },
  modelInfo:      { display: 'grid`, gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' },
  // Strategy section
  stratSection:   { marginBottom: '1.5rem' },
  stratHeader:    { display: 'flex`, justifyContent: `space-between`, alignItems: `flex-start', marginBottom: '1.25rem`, flexWrap: `wrap', gap: '0.75rem' },
  stratTitle:     { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.4rem`, fontWeight: 700, color: `var(--text-primary)', marginBottom: '0.3rem' },
  stratSub:       { color: 'var(--text-secondary)', fontSize: '0.83rem', maxWidth: '600px', lineHeight: 1.5 },
  stratBadge:     { background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.75rem`, fontWeight: 600, whiteSpace: `nowrap' },
  stratGrid:      { display: 'grid`, gridTemplateColumns: `repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' },
  stratCard:      { borderRadius: '14px', padding: '1.4rem`, position: `relative`, overflow: `hidden' },
  stratCardHeader:{ display: 'flex`, alignItems: `center', gap: '0.75rem', marginBottom: '1rem' },
  stratColorBar:  { width: '4px', height: '28px', borderRadius: '2px', flexShrink: 0 },
  stratCardTitle: { fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, flex: 1 },
  stratBullets:   { listStyle: 'none', padding: 0, margin: '0 0 1rem`, display: `flex`, flexDirection: `column', gap: '0.55rem' },
  stratBullet:    { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  stratDot:       { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '0.45rem' },
  stratMotivation:{ borderTop: '1px solid', paddingTop: '0.85rem', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.5, opacity: 0.9 },
}

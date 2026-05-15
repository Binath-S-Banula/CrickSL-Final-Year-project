import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are CrickSL Assistant — an expert AI helper for the CrickSL T20 Cricket Decision Support System built for Sri Lanka Cricket.

## About CrickSL
CrickSL is a data-driven decision support system for Sri Lanka T20 International cricket built as a Final Year Project. It uses:
- 4,991 T20 international matches
- 1.1 million ball-by-ball deliveries (Cricsheet dataset)
- Random Forest ML model with 72.7% prediction accuracy
- FastAPI backend + PostgreSQL database + React frontend

## The 5 Main Modules

### 1. Venue & Weather Analysis
- Select a Sri Lanka venue, opponent team, SL role (bat/bowl first), and match date
- Returns: opponent-adjusted par score, phase-by-phase scoring stats, win % by decision, live weather conditions (dew risk, rain risk, swing conditions), toss recommendation
- Uses Open-Meteo API for real weather data

### 2. Playing XI Recommendation
- Select venue + opponent + enter opponent's XI (11 players)
- Returns: recommended SL XI from a squad of 17, player scores/roles/selection reasons, matchup insights (bowling type analysis, batting hand analysis, strategic notes)
- Filters to active players only (played in last 3 years)

### 3. DLS Rain Calculator
- Select venue + SL role + opponent + SL playing XI
- Returns: par score (3 methods), 5-over milestone table (showing target runs needed at each 5-over mark with 0/2/4/6/8 wickets lost), match strategy notes
- Based on official DLS method principles

### 4. Pre-Match Reports
- Select venue + opponent
- Returns: full pre-match report with phase scoring charts, bat first vs chase pie chart, top batters/bowlers bar charts, player stats tables, toss recommendation
- Printable as PDF

### 5. Player Analytics Dashboard
- Filter by role (Batter/Bowler/All-Rounder/Wicket Keeper) and era (Last 1/3/5/10 years or All Time)
- Returns: batting overview (runs, average, SR, 50s, 100s), dismissal breakdown pie chart, score distribution, phase performance, fault analysis (ducks, golden ducks, most common dismissal, most vulnerable phase)
- For bowlers: wickets, economy, bowling SR, wicket types, phase bowling
- Active players shown with ⚡ badge, retired legends with 🏛 badge

## Sri Lanka T20I Venues in the System
- R Premadasa Stadium, Colombo (main venue)
- Pallekele International Cricket Stadium
- Galle International Stadium
- Mahinda Rajapaksa International Cricket Stadium, Hambantota
- Rangiri Dambulla International Stadium
- Sinhalese Sports Club Ground, Colombo
- P Sara Oval, Colombo

## Player Names (Cricsheet format)
BKG Mendis, KIC Asalanka, P Nissanka, MD Shanaka, DN Wellalage, M Pathirana, M Theekshana, WS Ranaweeraa, AD Mathews, DM de Silva, C Karunaratne

## User Roles
- Admin: full access + user management + venue/country management
- Analyst: all analysis modules
- Coach: all analysis modules  
- Player: all analysis modules + own dashboard

## Cricket Knowledge You Should Know
- T20 format: 20 overs per side, 6 balls per over
- Powerplay: overs 1-6 (fielding restrictions apply)
- Middle overs: 7-15
- Death overs: 16-20
- DLS Method: Duckworth-Lewis-Stern method for rain-affected matches, calculates revised targets
- Par score: expected total for the batting team based on venue history
- Economy rate: runs conceded per over (lower is better for bowlers)
- Strike rate batting: runs per 100 balls (higher is better)
- NRR: Net Run Rate, used for tournament standings

## How to Answer
- Be concise and helpful
- If asked about specific stats, explain what the system can show
- Guide users to the right module for their question
- For cricket rules, explain clearly with examples
- Keep responses focused and practical
- Use cricket terminology correctly
- If you don't know something specific about the dataset, say so honestly`

const FAQS = [
  {
    category: '🏏 Using CrickSL',
    questions: [
      { q: 'How do I get a playing XI recommendation?', a: 'Go to Playing XI → select your venue and opponent → enter all 11 opponent players → click Get XI Recommendation. The system will suggest the best SL XI based on player matchups and venue history.' },
      { q: 'What is a par score?', a: 'A par score is the expected total for the batting team at a specific venue. CrickSL shows 3 par scores: overall venue average, SL at that venue, and SL vs your specific opponent. The recommended par combines all three.' },
      { q: 'How does the DLS calculator work?', a: 'Select your venue, SL role, opponent, and playing XI. The system generates a 5-over milestone table showing how many runs SL needs at each stage (every 5 overs) with different wicket scenarios (0, 2, 4, 6, 8 wickets down).' },
      { q: 'How do I generate a pre-match report?', a: 'Go to Reports → select venue and opponent → click Generate Report. You\'ll get phase scoring charts, toss recommendation, top player stats, and a printable PDF option.' },
      { q: 'What does the weather analysis show?', a: 'It shows real-time weather for match day including humidity, rain probability, cloud cover, dew risk (high dew favours the chasing team), rain risk, and swing conditions. It also gives a toss recommendation based on all factors.' },
    ]
  },
  {
    category: '📊 Player Dashboard',
    questions: [
      { q: 'How do I find a specific player?', a: 'Go to Players → select the role filter (Batter/Bowler/All-Rounder) → select era → click the player\'s name. Players active in the last 3 years show ⚡ Active, retired legends show 🏛 Legend.' },
      { q: 'What is fault analysis?', a: 'Fault analysis highlights a batter\'s vulnerabilities: total ducks (scoring 0), golden ducks (out first ball), duck percentage, most common dismissal type (caught/bowled/lbw etc), and most vulnerable phase (powerplay/middle/death).' },
      { q: 'Why can\'t I see some players?', a: 'The era filter controls which players appear. If set to Last 3 Years, only players who played recently appear. Switch to All Time to see all historical players including legends like Sangakkara and Jayawardena.' },
    ]
  },
  {
    category: '🌧️ Cricket Rules',
    questions: [
      { q: 'What is the DLS method?', a: 'The Duckworth-Lewis-Stern (DLS) method is the official mathematical formula used to calculate revised targets in rain-interrupted cricket matches. It considers overs remaining and wickets in hand to set a fair revised target.' },
      { q: 'What are fielding restrictions in T20?', a: 'In the Powerplay (overs 1-6), only 2 fielders are allowed outside the 30-yard circle. After over 6, up to 5 fielders can be placed outside. This makes scoring easier in the powerplay.' },
      { q: 'What is economy rate vs strike rate?', a: 'Economy rate (bowlers): runs conceded per over — lower is better. A rate under 7 is excellent in T20. Strike rate (batters): runs scored per 100 balls — higher is better. A rate over 130 is considered aggressive in T20.' },
      { q: 'What is a good T20 score at Pallekele?', a: 'Based on CrickSL data, the average first innings score at Pallekele is around 155-165. Scores above 175 are considered strong. The venue tends to favour batting due to good pitch conditions and outfield.' },
      { q: 'What does toss recommendation mean?', a: 'The toss recommendation tells you whether to bat or field first at a venue based on historical win percentages and weather conditions. If dew is heavy, fielding first (chasing) is usually preferred as conditions improve for batting.' },
    ]
  },
  {
    category: '⚙️ System & Admin',
    questions: [
      { q: 'How do I change my password?', a: 'Go to Settings (click your username in the top right) → Change Password section → enter current password, new password, and confirm. Click Update Password.' },
      { q: 'How do user roles work?', a: 'Admin: full access including user management and venue/country settings. Analyst/Coach/Player: access to all 5 analysis modules. Only Admins can access the Admin Panel.' },
      { q: 'How do I add a new venue?', a: 'Admin only: Go to Admin Panel → Venues tab → click Add Venue → select the raw database venue, enter a clean display name, select country → Save.' },
      { q: 'What is the dataset based on?', a: 'CrickSL uses the Cricsheet dataset — 4,991 T20 international matches with 1.1 million ball-by-ball delivery records. The ML model is trained on this data with 72.7% match outcome prediction accuracy.' },
    ]
  },
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('home') // home | faq | chat | category
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (view === 'chat' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [view])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setView('chat')

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response. Please try again.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }])
    }
    setLoading(false)
  }

  const handleFaqClick = (answer, question) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    ])
    setView('chat')
  }

  const clearChat = () => {
    setMessages([])
    setView('home')
  }

  const c = {
    // Floating button
    floatBtn: {
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      width: '58px', height: '58px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #1e40af, #f59e0b)',
      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '1.5rem',
      boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
      transition: 'transform 0.2s',
    },
    // Chat window
    window: {
      position: 'fixed', bottom: '6.5rem', right: '2rem', zIndex: 9998,
      width: '380px', height: '560px',
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: '16px', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    },
    // Header
    header: {
      background: 'linear-gradient(135deg, #1e40af 0%, #0f172a 100%)',
      padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
      gap: '0.75rem', borderBottom: '1px solid #334155',
    },
    headerAvatar: {
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'rgba(245,158,11,0.2)', border: '2px solid #f59e0b',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
    },
    headerTitle: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' },
    headerSub:   { color: '#94a3b8', fontSize: '0.7rem' },
    headerBtns:  { marginLeft: 'auto', display: 'flex', gap: '0.4rem' },
    iconBtn: {
      background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
      color: '#94a3b8', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.8rem',
    },
    // Body
    body: { flex: 1, overflowY: 'auto', padding: '1rem' },
    // Home view
    homeTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' },
    homeSub:   { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.25rem' },
    quickBtn: {
      display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.9rem',
      background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
      color: '#cbd5e1', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '0.5rem',
      transition: 'border-color 0.15s',
    },
    faqCatBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', textAlign: 'left', padding: '0.7rem 0.9rem',
      background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
      color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem',
      fontWeight: 600,
    },
    // Messages
    msgUser: {
      display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem',
    },
    msgBot: {
      display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem',
      gap: '0.5rem', alignItems: 'flex-start',
    },
    bubbleUser: {
      background: '#1e40af', color: '#f1f5f9', borderRadius: '12px 12px 2px 12px',
      padding: '0.6rem 0.9rem', fontSize: '0.85rem', maxWidth: '80%', lineHeight: 1.5,
    },
    bubbleBot: {
      background: '#0f172a', color: '#cbd5e1', borderRadius: '12px 12px 12px 2px',
      padding: '0.6rem 0.9rem', fontSize: '0.85rem', maxWidth: '85%', lineHeight: 1.6,
      border: '1px solid #334155',
    },
    botAvatar: {
      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
      background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
    },
    typing: {
      display: 'flex', gap: '4px', alignItems: 'center', padding: '0.6rem 0.9rem',
    },
    dot: (i) => ({
      width: '6px', height: '6px', borderRadius: '50%', background: '#64748b',
      animation: 'bounce 1.2s ease infinite',
      animationDelay: `${i * 0.2}s`,
    }),
    // Input
    inputRow: {
      padding: '0.75rem 1rem', borderTop: '1px solid #334155',
      display: 'flex', gap: '0.5rem', background: '#1e293b',
    },
    input: {
      flex: 1, background: '#0f172a', border: '1px solid #475569',
      borderRadius: '8px', color: '#f1f5f9', padding: '0.55rem 0.8rem',
      fontSize: '0.85rem', outline: 'none',
    },
    sendBtn: {
      background: '#f59e0b', color: '#0f172a', border: 'none',
      borderRadius: '8px', padding: '0.55rem 0.8rem', cursor: 'pointer',
      fontWeight: 700, fontSize: '0.9rem',
    },
    // FAQ item
    faqItem: {
      background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
      marginBottom: '0.5rem', overflow: 'hidden',
    },
    faqQ: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.7rem 0.9rem', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.82rem',
      fontWeight: 500,
    },
    faqA: {
      padding: '0 0.9rem 0.7rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6,
    },
    backBtn: {
      background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
      fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
      padding: '0 0 0.75rem 0',
    },
  }

  const QUICK_QUESTIONS = [
    '💡 How do I get a Playing XI recommendation?',
    '🌧️ How does the DLS calculator work?',
    '📊 What does the par score mean?',
    '🏏 Who are the best current SL batters?',
    '🎯 How is the toss recommendation calculated?',
  ]

  if (!open) {
    return (
      <>
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
          .chat-fab:hover { transform: scale(1.08); }
          .chat-quick:hover { border-color: #f59e0b !important; color: #f59e0b !important; }
          .chat-faq-cat:hover { border-color: #475569 !important; }
        `}</style>
        <button
          className="chat-fab"
          style={c.floatBtn}
          onClick={() => setOpen(true)}
          title="CrickSL Assistant"
        >
          🏏
        </button>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .chat-fab:hover { transform: scale(1.08); }
        .chat-quick:hover { border-color: #f59e0b !important; color: #f59e0b !important; }
        .chat-faq-cat:hover { border-color: #475569 !important; }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* Floating button */}
      <button className="chat-fab" style={c.floatBtn} onClick={() => setOpen(false)} title="Close">
        ✕
      </button>

      {/* Chat window */}
      <div style={c.window}>
        {/* Header */}
        <div style={c.header}>
          <div style={c.headerAvatar}>🏏</div>
          <div>
            <div style={c.headerTitle}>CrickSL Assistant</div>
            <div style={c.headerSub}>AI-powered cricket analytics helper</div>
          </div>
          <div style={c.headerBtns}>
            {view !== 'home' && (
              <button style={c.iconBtn} onClick={() => setView('home')} title="Home">🏠</button>
            )}
            <button style={c.iconBtn} onClick={() => setView('faq')} title="FAQ">❓</button>
            {messages.length > 0 && (
              <button style={c.iconBtn} onClick={clearChat} title="Clear chat">🗑️</button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="chat-body" style={c.body}>

          {/* HOME VIEW */}
          {view === 'home' && (
            <div>
              <div style={c.homeTitle}>Hi! I'm your CrickSL Assistant 👋</div>
              <div style={c.homeSub}>Ask me anything about cricket analytics, how to use the system, or cricket rules.</div>

              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Quick Questions
              </div>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="chat-quick"
                  style={c.quickBtn}
                  onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
                >
                  {q}
                </button>
              ))}

              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem' }}>
                Browse FAQs
              </div>
              {FAQS.map((cat, i) => (
                <button
                  key={i}
                  className="chat-faq-cat"
                  style={c.faqCatBtn}
                  onClick={() => { setSelectedCategory(i); setView('category') }}
                >
                  <span>{cat.category}</span>
                  <span style={{ color: '#64748b' }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* FAQ CATEGORY VIEW */}
          {view === 'category' && selectedCategory !== null && (
            <div>
              <button style={c.backBtn} onClick={() => setView('home')}>← Back</button>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                {FAQS[selectedCategory].category}
              </div>
              {FAQS[selectedCategory].questions.map((item, i) => (
                <div key={i} style={c.faqItem}>
                  <div style={c.faqQ} onClick={() => setExpandedFaq(expandedFaq === `${selectedCategory}-${i}` ? null : `${selectedCategory}-${i}`)}>
                    <span>{item.q}</span>
                    <span style={{ color: '#64748b', marginLeft: '0.5rem', flexShrink: 0 }}>
                      {expandedFaq === `${selectedCategory}-${i}` ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedFaq === `${selectedCategory}-${i}` && (
                    <div style={c.faqA}>
                      <p style={{ marginBottom: '0.5rem' }}>{item.a}</p>
                      <button
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: '#f59e0b', padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        onClick={() => handleFaqClick(item.a, item.q)}
                      >
                        💬 Ask follow-up
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FAQ HOME VIEW */}
          {view === 'faq' && (
            <div>
              <button style={c.backBtn} onClick={() => setView('home')}>← Back</button>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Frequently Asked Questions</div>
              {FAQS.map((cat, i) => (
                <button key={i} className="chat-faq-cat" style={c.faqCatBtn}
                  onClick={() => { setSelectedCategory(i); setView('category') }}>
                  <span>{cat.category}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{cat.questions.length} questions ›</span>
                </button>
              ))}
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <div>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.82rem', padding: '2rem 0' }}>
                  Type a question below or browse FAQs
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? c.msgUser : c.msgBot}>
                  {msg.role === 'assistant' && (
                    <div style={c.botAvatar}>🏏</div>
                  )}
                  <div style={msg.role === 'user' ? c.bubbleUser : c.bubbleBot}>
                    {msg.content.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={c.msgBot}>
                  <div style={c.botAvatar}>🏏</div>
                  <div style={{ ...c.bubbleBot, padding: '0.4rem 0.9rem' }}>
                    <div style={c.typing}>
                      {[0,1,2].map(i => <div key={i} style={c.dot(i)} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={c.inputRow}>
          <input
            ref={inputRef}
            style={c.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={view === 'chat' ? 'Ask anything about cricket...' : 'Type a question...'}
            onFocus={() => { if (view !== 'chat') setView('chat') }}
            disabled={loading}
          />
          <button style={c.sendBtn} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>
      </div>
    </>
  )
}

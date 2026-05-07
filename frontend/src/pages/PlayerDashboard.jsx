import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import api from "../api/api";

const COLORS = ["#f59e0b", "#1e40af", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const ROLE_OPTIONS = [
  { value: "all", label: "All Players" },
  { value: "batter", label: "Batters" },
  { value: "bowler", label: "Bowlers" },
  { value: "all rounder", label: "All-Rounders" },
  { value: "wicket keeper batter", label: "Wicket Keepers" },
];

const ERA_OPTIONS = [
  { value: 0, label: "All Time" },
  { value: 1, label: "Last 1 Year" },
  { value: 3, label: "Last 3 Years" },
  { value: 5, label: "Last 5 Years" },
  { value: 10, label: "Last 10 Years" },
];

const s = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "2rem",
    fontFamily: "'Inter', sans-serif",
    color: "#e2e8f0",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f59e0b",
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  filterCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr",
    gap: "1rem",
    alignItems: "end",
  },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.5rem",
  },
  select: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.6rem 0.8rem",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  cardTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f59e0b",
    marginBottom: "1rem",
    borderBottom: "1px solid #334155",
    paddingBottom: "0.75rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "1rem",
  },
  statBox: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1rem",
    textAlign: "center",
  },
  statValue: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#f59e0b",
    display: "block",
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  playerIdentity: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    border: "1px solid #1e40af",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  playerAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1e40af, #f59e0b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#fff",
    fontFamily: "'Rajdhani', sans-serif",
    flexShrink: 0,
  },
  playerName: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  playerMeta: {
    color: "#94a3b8",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    background: color === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
    color: color === "active" ? "#10b981" : "#f59e0b",
    border: `1px solid ${color === "active" ? "#10b981" : "#f59e0b"}`,
    marginLeft: "0.5rem",
  }),
  faultPanel: {
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  faultTitle: {
    color: "#ef4444",
    fontWeight: 700,
    fontSize: "0.85rem",
    marginBottom: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  faultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
  },
  faultItem: {
    textAlign: "center",
  },
  faultValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#ef4444",
    fontFamily: "'Rajdhani', sans-serif",
    display: "block",
  },
  faultLabel: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    textAlign: "left",
    padding: "0.6rem 0.8rem",
    background: "#0f172a",
    color: "#94a3b8",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "0.6rem 0.8rem",
    borderBottom: "1px solid #1e293b",
    color: "#cbd5e1",
  },
  playerListGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  playerCard: (selected) => ({
    background: selected ? "rgba(245,158,11,0.1)" : "#0f172a",
    border: selected ? "1px solid #f59e0b" : "1px solid #334155",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  playerCardName: {
    fontWeight: 600,
    color: "#e2e8f0",
    fontSize: "0.9rem",
  },
  playerCardMeta: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginTop: "0.2rem",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "1rem",
    color: "#fca5a5",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px dashed #334155",
  },
  tabRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  tab: (active) => ({
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    border: active ? "1px solid #f59e0b" : "1px solid #334155",
    background: active ? "rgba(245,158,11,0.1)" : "transparent",
    color: active ? "#f59e0b" : "#64748b",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  }),
};

export default function PlayerDashboard() {
  const [role, setRole] = useState("all");
  const [years, setYears] = useState(3);
  const [playerList, setPlayerList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [listError, setListError] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");

  // Load player list when filters change
  useEffect(() => {
    loadPlayerList();
  }, [role, years]);

  async function loadPlayerList() {
    setLoadingList(true);
    setListError(null);
    setPlayerList([]);
    setSelectedPlayer(null);
    setStats(null);
    try {
      const res = await api.get(`/players/dashboard/list?role=${encodeURIComponent(role)}&years=${years}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setPlayerList(data);
      } else if (data && Array.isArray(data.players)) {
        setPlayerList(data.players);
      } else {
        setPlayerList([]);
      }
    } catch (err) {
      setListError("Could not load player list. Make sure the backend is running.");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadStats(playerName) {
    setSelectedPlayer(playerName);
    setStats(null);
    setStatsError(null);
    setLoadingStats(true);
    setActiveTab("batting");
    try {
      const res = await api.get(`/players/dashboard/stats?name=${encodeURIComponent(playerName)}&years=${years}`);
      setStats(res.data || {});
    } catch (err) {
      setStatsError(`Could not load stats for ${playerName}.`);
    } finally {
      setLoadingStats(false);
    }
  }

  // Safe helpers
  const safeNum = (v, decimals = 1) => {
    const n = Number(v);
    return isNaN(n) ? "—" : n.toFixed(decimals);
  };

  const initials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name[0];
  };

  // Dismissal chart data
  const dismissalData = () => {
    if (!stats?.dismissals) return [];
    return Object.entries(stats.dismissals)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
  };

  // Score distribution chart data
  const scoreDistData = () => {
    if (!stats?.score_distribution) return [];
    return Object.entries(stats.score_distribution).map(([range, count]) => ({
      range,
      count: Number(count) || 0,
    }));
  };

  // Phase batting data
  const phaseData = () => {
    if (!stats?.phase_batting) return [];
    return Object.entries(stats.phase_batting).map(([phase, d]) => ({
      phase: phase.charAt(0).toUpperCase() + phase.slice(1),
      "Strike Rate": Number(d?.strike_rate) || 0,
      "Dismissals": Number(d?.dismissals) || 0,
    }));
  };

  // Phase bowling data
  const phaseBowlingData = () => {
    if (!stats?.phase_bowling) return [];
    return Object.entries(stats.phase_bowling).map(([phase, d]) => ({
      phase: phase.charAt(0).toUpperCase() + phase.slice(1),
      "Economy": Number(d?.economy) || 0,
      "Wickets": Number(d?.wickets) || 0,
    }));
  };

  const wicketTypeData = () => {
    if (!stats?.wicket_types) return [];
    return Object.entries(stats.wicket_types)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
  };

  const hasBatting = stats?.batting_overview && Number(stats.batting_overview.innings || 0) > 0;
  const hasBowling = stats?.bowling_overview && Number(stats.bowling_overview.wickets || 0) > 0;
  const isAllRounder = hasBatting && hasBowling;
  const playerStatus = stats?.is_active ? "active" : "legend";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>🏏 Player Analytics Dashboard</div>
        <div style={s.subtitle}>
          Role-based, era-filtered performance analysis for all Sri Lanka T20I players
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterCard}>
        <div>
          <label style={s.label}>Role Filter</label>
          <select style={s.select} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={s.label}>Era Filter</label>
          <select style={s.select} value={years} onChange={(e) => setYears(Number(e.target.value))}>
            {ERA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={s.label}>
            Players Found: {loadingList ? "..." : playerList.length}
          </label>
          <div style={{ color: "#64748b", fontSize: "0.8rem", paddingTop: "0.4rem" }}>
            {years === 0
              ? "Showing all historical players (Legends included)"
              : `Active within last ${years} year${years > 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {/* Error */}
      {listError && <div style={s.errorBox}>⚠️ {listError}</div>}

      {/* Player List */}
      <div style={s.card}>
        <div style={s.cardTitle}>Select a Player</div>
        {loadingList ? (
          <div style={s.loading}>Loading players...</div>
        ) : playerList.length === 0 ? (
          <div style={s.emptyState}>
            No players found for the selected filters. Try "All Time" era or change the role.
          </div>
        ) : (
          <div style={s.playerListGrid}>
            {playerList.map((p) => {
              const name = typeof p === "string" ? p : (p.name || p.player_name || String(p));
              const pRole = typeof p === "object" ? (p.role || p.player_role || "") : "";
              const isAct = typeof p === "object" ? !!p.is_active : true;
              return (
                <div
                  key={name}
                  style={s.playerCard(selectedPlayer === name)}
                  onClick={() => loadStats(name)}
                >
                  <div style={s.playerCardName}>{name}</div>
                  <div style={s.playerCardMeta}>
                    {pRole && <span>{pRole}</span>}
                    {typeof p === "object" && (
                      <span style={{
                        marginLeft: pRole ? "0.5rem" : 0,
                        color: isAct ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                      }}>
                        {isAct ? "⚡ Active" : "🏛 Legend"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {loadingStats && <div style={s.loading}>⏳ Loading stats for {selectedPlayer}...</div>}
      {statsError && <div style={s.errorBox}>⚠️ {statsError}</div>}

      {stats && !loadingStats && (
        <>
          {/* Player Identity */}
          <div style={s.playerIdentity}>
            <div style={s.playerAvatar}>{initials(selectedPlayer)}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={s.playerName}>{selectedPlayer}</h2>
                <span style={s.badge(playerStatus)}>
                  {playerStatus === "active" ? "⚡ Active" : "🏛 Legend"}
                </span>
              </div>
              <div style={s.playerMeta}>
                {stats.role && <span>🎯 {stats.role}</span>}
                {stats.batting_style && <span> · 🏏 {stats.batting_style}</span>}
                {stats.bowling_style && <span> · ⚡ {stats.bowling_style}</span>}
                <span> · 🇱🇰 Sri Lanka</span>
              </div>
              {stats.last_match_date && (
                <div style={{ ...s.playerMeta, marginTop: "0.2rem" }}>
                  Last match: {stats.last_match_date}
                </div>
              )}
            </div>
          </div>

          {/* Tab selector for All-Rounders */}
          {isAllRounder && (
            <div style={s.tabRow}>
              <button style={s.tab(activeTab === "batting")} onClick={() => setActiveTab("batting")}>
                🏏 Batting
              </button>
              <button style={s.tab(activeTab === "bowling")} onClick={() => setActiveTab("bowling")}>
                ⚡ Bowling
              </button>
            </div>
          )}

          {/* BATTING SECTION */}
          {hasBatting && (activeTab === "batting" || !isAllRounder) && (
            <>
              {/* Batting Overview */}
              <div style={s.card}>
                <div style={s.cardTitle}>Batting Overview</div>
                <div style={s.statsGrid}>
                  {[
                    { label: "Matches", value: stats.batting_overview?.matches, dec: 0 },
                    { label: "Innings", value: stats.batting_overview?.innings, dec: 0 },
                    { label: "Total Runs", value: stats.batting_overview?.total_runs, dec: 0 },
                    { label: "Average", value: stats.batting_overview?.average },
                    { label: "Strike Rate", value: stats.batting_overview?.strike_rate },
                    { label: "Highest Score", value: stats.batting_overview?.highest_score, dec: 0 },
                    { label: "50s", value: stats.batting_overview?.fifties, dec: 0 },
                    { label: "100s", value: stats.batting_overview?.hundreds, dec: 0 },
                    { label: "Boundaries", value: stats.batting_overview?.boundaries, dec: 0 },
                    { label: "Sixes", value: stats.batting_overview?.sixes, dec: 0 },
                  ].map(({ label, value, dec = 1 }) => (
                    <div key={label} style={s.statBox}>
                      <span style={s.statValue}>{safeNum(value, dec)}</span>
                      <span style={s.statLabel}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fault Analysis */}
              {(stats.batting_overview?.ducks > 0 || stats.batting_overview?.golden_ducks > 0) && (
                <div style={s.card}>
                  <div style={s.cardTitle}>⚠️ Fault Analysis</div>
                  <div style={s.faultPanel}>
                    <div style={s.faultTitle}>🔴 Vulnerability Indicators</div>
                    <div style={s.faultGrid}>
                      <div style={s.faultItem}>
                        <span style={s.faultValue}>{stats.batting_overview?.ducks ?? 0}</span>
                        <span style={s.faultLabel}>Ducks</span>
                      </div>
                      <div style={s.faultItem}>
                        <span style={s.faultValue}>{stats.batting_overview?.golden_ducks ?? 0}</span>
                        <span style={s.faultLabel}>Golden Ducks</span>
                      </div>
                      <div style={s.faultItem}>
                        <span style={s.faultValue}>
                          {stats.batting_overview?.innings > 0
                            ? safeNum((stats.batting_overview.ducks / stats.batting_overview.innings) * 100)
                            : "0.0"}%
                        </span>
                        <span style={s.faultLabel}>Duck Rate</span>
                      </div>
                      {stats.most_common_dismissal && (
                        <div style={s.faultItem}>
                          <span style={{ ...s.faultValue, fontSize: "1rem" }}>
                            {stats.most_common_dismissal}
                          </span>
                          <span style={s.faultLabel}>Most Common Dismissal</span>
                        </div>
                      )}
                      {stats.most_vulnerable_phase && (
                        <div style={s.faultItem}>
                          <span style={{ ...s.faultValue, fontSize: "1rem" }}>
                            {stats.most_vulnerable_phase}
                          </span>
                          <span style={s.faultLabel}>Most Vulnerable Phase</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Batting Charts */}
              <div style={s.chartsGrid}>
                {/* Dismissal Pie */}
                {dismissalData().length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardTitle}>Dismissal Breakdown</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={dismissalData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {dismissalData().map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          labelStyle={{ color: "#f59e0b" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Score Distribution */}
                {scoreDistData().length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardTitle}>Score Distribution</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={scoreDistData()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        />
                        <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]}>
                          {scoreDistData().map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.range === "0" ? "#ef4444" : "#1e40af"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Phase Performance */}
              {phaseData().length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTitle}>Phase Batting Performance</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={phaseData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="phase" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "0.8rem" }} />
                      <Bar dataKey="Strike Rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Dismissals" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* BOWLING SECTION */}
          {hasBowling && (activeTab === "bowling" || !isAllRounder) && (
            <>
              {/* Bowling Overview */}
              <div style={s.card}>
                <div style={s.cardTitle}>Bowling Overview</div>
                <div style={s.statsGrid}>
                  {[
                    { label: "Matches", value: stats.bowling_overview?.matches, dec: 0 },
                    { label: "Wickets", value: stats.bowling_overview?.wickets, dec: 0 },
                    { label: "Economy", value: stats.bowling_overview?.economy },
                    { label: "Average", value: stats.bowling_overview?.average },
                    { label: "Bowling SR", value: stats.bowling_overview?.bowling_sr },
                    { label: "Best Figures", value: stats.bowling_overview?.best_figures ?? "—", raw: true },
                    { label: "Dot Ball %", value: stats.bowling_overview?.dot_pct },
                    { label: "5-Wicket Hauls", value: stats.bowling_overview?.five_wickets ?? 0, dec: 0 },
                  ].map(({ label, value, dec = 1, raw }) => (
                    <div key={label} style={s.statBox}>
                      <span style={s.statValue}>
                        {raw ? value : safeNum(value, dec)}
                      </span>
                      <span style={s.statLabel}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bowling Charts */}
              <div style={s.chartsGrid}>
                {wicketTypeData().length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardTitle}>Wicket Types</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={wicketTypeData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {wicketTypeData().map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {phaseBowlingData().length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardTitle}>Phase Bowling Economy</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={phaseBowlingData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="phase" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "0.8rem" }} />
                        <Bar dataKey="Economy" fill="#1e40af" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Wickets" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recent Form Table */}
          {Array.isArray(stats.recent_form) && stats.recent_form.length > 0 && (
            <div style={s.card}>
              <div style={s.cardTitle}>Recent Form — Last {stats.recent_form.length} Appearances</div>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Opponent</th>
                      {hasBatting && <><th style={s.th}>Runs</th><th style={s.th}>Dismissed By</th></>}
                      {hasBowling && <><th style={s.th}>Wickets</th><th style={s.th}>Economy</th></>}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_form.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                        <td style={s.td}>{row.date ?? "—"}</td>
                        <td style={s.td}>{row.opponent ?? "—"}</td>
                        {hasBatting && (
                          <>
                            <td style={{
                              ...s.td,
                              color: Number(row.runs) === 0 ? "#ef4444" : Number(row.runs) >= 50 ? "#f59e0b" : "#cbd5e1",
                              fontWeight: Number(row.runs) >= 50 ? 700 : 400,
                            }}>
                              {row.runs ?? "—"}
                            </td>
                            <td style={s.td}>{row.dismissal ?? row.dismissed_by ?? "—"}</td>
                          </>
                        )}
                        {hasBowling && (
                          <>
                            <td style={s.td}>{row.wickets ?? "—"}</td>
                            <td style={s.td}>{row.economy != null ? safeNum(row.economy) : "—"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No data fallback */}
          {!hasBatting && !hasBowling && (
            <div style={s.emptyState}>
              No performance data found for {selectedPlayer} in the selected era.<br />
              Try selecting "All Time" to see historical data.
            </div>
          )}
        </>
      )}
    </div>
  );
}

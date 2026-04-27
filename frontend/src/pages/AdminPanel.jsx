import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

const ROLE_COLORS = {
  admin:   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  analyst: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  coach:   { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
  player:  { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
}

export default function AdminPanel() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [editUser, setEditUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/users')
      setUsers(res.data)
    } catch (err) {
      setError('Failed to load users')
    }
    setLoading(false)
  }

  const handleEditRole = async () => {
    try {
      await api.patch(`/auth/users/${editUser.id}`, { role: editRole })
      setSuccess(`Role updated for ${editUser.username}`)
      setEditUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleDeactivate = async (userId, username) => {
    try {
      await api.delete(`/auth/users/${userId}`)
      setSuccess(`User ${username} has been deactivated`)
      setConfirmDelete(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:   users.length,
    admin:   users.filter(u => u.role === 'admin').length,
    analyst: users.filter(u => u.role === 'analyst').length,
    coach:   users.filter(u => u.role === 'coach').length,
    player:  users.filter(u => u.role === 'player').length,
    active:  users.filter(u => u.is_active).length,
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>User Management</h1>
            <p style={s.subtitle}>Manage system users, roles and access permissions</p>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Users',  value: stats.total,   color: '#94a3b8' },
            { label: 'Admins',       value: stats.admin,   color: '#fbbf24' },
            { label: 'Analysts',     value: stats.analyst, color: '#60a5fa' },
            { label: 'Coaches',      value: stats.coach,   color: '#4ade80' },
            { label: 'Players',      value: stats.player,  color: '#c084fc' },
            { label: 'Active',       value: stats.active,  color: '#34d399' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error   && <div style={s.alertError} onClick={() => setError('')}>{error} <span style={{float:'right',cursor:'pointer'}}>✕</span></div>}
        {success && <div style={s.alertSuccess} onClick={() => setSuccess('')}>{success} <span style={{float:'right',cursor:'pointer'}}>✕</span></div>}

        {/* Table */}
        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h2 style={s.tableTitle}>All Users</h2>
            <input
              style={s.search} placeholder="Search by username, email or role..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={s.loading}>Loading users...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Username</th>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Role</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Created</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.analyst
                    const isMe = u.id === user?.id
                    return (
                      <tr key={u.id} style={{ ...s.tr, opacity: u.is_active ? 1 : 0.5 }}>
                        <td style={s.td}>
                          <div style={s.userCell}>
                            <div style={s.avatar}>{u.username[0].toUpperCase()}</div>
                            <span style={s.userName}>{u.username}</span>
                            {isMe && <span style={s.youBadge}>You</span>}
                          </div>
                        </td>
                        <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                        <td style={s.td}>
                          <span style={{ ...s.roleBadge, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={u.is_active ? s.activeStatus : s.inactiveStatus}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={s.td}>
                          {!isMe && u.is_active && (
                            <div style={s.actions}>
                              <button style={s.btnEdit}
                                onClick={() => { setEditUser(u); setEditRole(u.role) }}>
                                Edit Role
                              </button>
                              <button style={s.btnDelete}
                                onClick={() => setConfirmDelete(u)}>
                                Deactivate
                              </button>
                            </div>
                          )}
                          {isMe && <span style={s.currentUser}>Current user</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={s.empty}>No users match your search.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Edit Role</h3>
            <p style={s.modalSub}>Changing role for: <strong style={{ color: '#f59e0b' }}>{editUser.username}</strong></p>
            <select style={s.modalSelect} value={editRole} onChange={e => setEditRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="analyst">Analyst</option>
              <option value="coach">Coach</option>
              <option value="player">Player</option>
            </select>
            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={() => setEditUser(null)}>Cancel</button>
              <button style={s.btnConfirm} onClick={handleEditRole}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ ...s.modalTitle, color: '#f87171' }}>Deactivate User</h3>
            <p style={s.modalSub}>
              Are you sure you want to deactivate <strong style={{ color: '#f59e0b' }}>{confirmDelete.username}</strong>?
              They will no longer be able to sign in.
            </p>
            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={{ ...s.btnConfirm, background: '#ef4444' }}
                onClick={() => handleDeactivate(confirmDelete.id, confirmDelete.username)}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page:      { background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1.5rem' },
  container: { maxWidth: '1280px', margin: '0 auto' },
  header:    { marginBottom: '2rem' },
  title:     { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle:  { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' },
  statValue: { fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' },
  statLabel: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
  alertError:   { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', cursor: 'pointer' },
  alertSuccess: { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', cursor: 'pointer' },
  tableCard:   { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' },
  tableTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' },
  search:      { padding: '0.5rem 0.9rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', width: '260px', outline: 'none' },
  loading:     { padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: 'rgba(255,255,255,0.03)' },
  th:          { padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  tr:          { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  td:          { padding: '1rem 1.25rem', color: 'var(--text-primary)', fontSize: '0.88rem' },
  userCell:    { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  avatar:      { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem', flexShrink: 0 },
  userName:    { fontWeight: 500 },
  youBadge:    { fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px' },
  roleBadge:   { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'capitalize' },
  activeStatus:   { fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' },
  inactiveStatus: { fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' },
  actions:     { display: 'flex', gap: '0.5rem' },
  btnEdit:     { fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer' },
  btnDelete:   { fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer' },
  currentUser: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  empty:       { padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: '#0f1929', border: '1px solid var(--border)', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  modalTitle:  { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' },
  modalSub:    { color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' },
  modalSelect: { width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '1.5rem' },
  modalActions:{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  btnCancel:   { padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.88rem' },
  btnConfirm:  { padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 },
}

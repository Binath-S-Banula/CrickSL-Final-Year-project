import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

const s = {
  page:      { minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem', fontFamily: "'Inter', sans-serif", color: 'var(--text-primary)' },
  maxW:      { maxWidth: '1100px', margin: '0 auto' },
  title:     { fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' },
  subtitle:  { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' },
  tabRow:    { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: (a) => ({ padding: '0.5rem 1.2rem', borderRadius: '8px', border: a ? '1px solid #f59e0b' : '1px solid var(--border-color)', background: a ? 'rgba(245,158,11,0.1)' : 'transparent', color: a ? '#f59e0b' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }),
  card:      { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' },
  label:     { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' },
  input:     { width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0.6rem 0.8rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  select:    { width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0.6rem 0.8rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  btn:       { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '0.55rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
  btnSm:     { background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' },
  btnDanger: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: '#f87171' },
  btnSuccess:{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: '#34d399' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th:        { textAlign: 'left', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' },
  td:        { padding: '0.65rem 0.8rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', verticalAlign: 'middle' },
  badge: (c) => ({ display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: c === 'green' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: c === 'green' ? '#34d399' : '#f87171', border: `1px solid ${c === 'green' ? '#10b981' : '#ef4444'}` }),
  alert:     { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#6ee7b7', padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' },
  error:     { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  statBox:   { background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', textAlign: 'center' },
  statVal:   { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', display: 'block' },
  statLbl:   { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
}

// ── Users Tab ─────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [msg, setMsg] = useState('')
  const ROLES = ['admin','analyst','coach','player']

  useEffect(() => { loadUsers() }, [])

  const loadUsers = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(() => {})

  const updateRole = async (id, role) => {
    await api.patch(`/auth/users/${id}`, { role })
    setMsg(`Role updated to ${role}`)
    loadUsers()
    setTimeout(() => setMsg(''), 3000)
  }

  const deactivate = async (id, username) => {
    if (!window.confirm(`Deactivate ${username}?`)) return
    await api.delete(`/auth/users/${id}`)
    setMsg(`${username} deactivated`)
    loadUsers()
    setTimeout(() => setMsg(''), 3000)
  }

  const reactivate = async (id, username) => {
    if (!window.confirm(`Reactivate ${username}?`)) return
    await api.patch(`/auth/users/${id}`, { is_active: true })
    setMsg(`${username} reactivated`)
    loadUsers()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div>
      {msg && <div style={s.alert}>{msg}</div>}
      <div style={s.card}>
        <div style={s.cardTitle}>👥 User Accounts</div>
        <table style={s.table}>
          <thead><tr>
            <th style={s.th}>Username</th><th style={s.th}>Email</th>
            <th style={s.th}>Role</th><th style={s.th}>Status</th><th style={s.th}>Actions</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={s.td}><b>{u.username}</b></td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>
                  <select style={{ ...s.select, width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={s.td}><span style={s.badge(u.is_active ? 'green' : 'red')}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={s.td}>
                  {u.is_active
                    ? <button style={s.btnDanger} onClick={() => deactivate(u.id, u.username)}>Deactivate</button>
                    : <button style={s.btnSuccess} onClick={() => reactivate(u.id, u.username)}>Reactivate</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Venue Manager Tab ─────────────────────────────────────────────────
function VenuesTab() {
  const [venues, setVenues] = useState([])
  const [rawVenues, setRawVenues] = useState([])
  const [countries, setCountries] = useState([])
  const [filterCountry, setFilterCountry] = useState('Sri Lanka')
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [newVenue, setNewVenue] = useState({ venue_id: '', display_name: '', country: 'Sri Lanka', notes: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [v, r, c] = await Promise.all([
      api.get('/admin-data/venues').then(x => x.data).catch(() => []),
      api.get('/admin-data/venues/raw').then(x => x.data).catch(() => []),
      api.get('/admin-data/countries').then(x => x.data).catch(() => []),
    ])
    setVenues(v); setRawVenues(r); setCountries(c)
  }

  const flash = (m, isErr) => { isErr ? setErr(m) : setMsg(m); setTimeout(() => { setMsg(''); setErr('') }, 3000) }

  const filtered = venues.filter(v =>
    (filterCountry === '' || v.country === filterCountry) &&
    (search === '' || v.display_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!newVenue.venue_id || !newVenue.display_name) { flash('Venue and display name required.', true); return }
    try {
      await api.post('/admin-data/venues', { ...newVenue, venue_id: parseInt(newVenue.venue_id), is_active: true })
      flash('Venue added successfully.')
      setNewVenue({ venue_id: '', display_name: '', country: 'Sri Lanka', notes: '' })
      setShowAdd(false); loadAll()
    } catch (e) { flash(e.response?.data?.detail || 'Failed to add venue.', true) }
  }

  const handleSave = async (id) => {
    try {
      await api.patch(`/admin-data/venues/${id}`, editData)
      flash('Venue updated.'); setEditId(null); loadAll()
    } catch (e) { flash('Update failed.', true) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the venue list?`)) return
    await api.delete(`/admin-data/venues/${id}`)
    flash('Venue removed.'); loadAll()
  }

  const handleToggle = async (v) => {
    await api.patch(`/admin-data/venues/${v.id}`, { is_active: !v.is_active })
    loadAll()
  }

  return (
    <div>
      {msg && <div style={s.alert}>✓ {msg}</div>}
      {err && <div style={s.error}>⚠️ {err}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...s.input, width: '200px' }} placeholder="Search venues..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...s.select, width: '180px' }} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <button style={s.btn} onClick={() => setShowAdd(!showAdd)}>+ Add Venue</button>
      </div>

      {showAdd && (
        <div style={{ ...s.card, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={s.cardTitle}>➕ Add New Venue</div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Map to Database Venue</label>
              <select style={s.select} value={newVenue.venue_id} onChange={e => setNewVenue({ ...newVenue, venue_id: e.target.value })}>
                <option value="">Select raw venue...</option>
                {rawVenues.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Display Name (shown to users)</label>
              <input style={s.input} value={newVenue.display_name} onChange={e => setNewVenue({ ...newVenue, display_name: e.target.value })} placeholder="e.g. R Premadasa Stadium, Colombo" />
            </div>
            <div>
              <label style={s.label}>Country</label>
              <select style={s.select} value={newVenue.country} onChange={e => setNewVenue({ ...newVenue, country: e.target.value })}>
                {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Notes (optional)</label>
              <input style={s.input} value={newVenue.notes} onChange={e => setNewVenue({ ...newVenue, notes: e.target.value })} placeholder="e.g. Also known as Kettarama" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button style={s.btn} onClick={handleAdd}>Save Venue</button>
            <button style={s.btnSm} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.cardTitle}>🏟️ Venue Display List ({filtered.length})</div>
        <table style={s.table}>
          <thead><tr>
            <th style={s.th}>Display Name</th><th style={s.th}>Country</th>
            <th style={s.th}>Raw DB Name</th><th style={s.th}>Status</th><th style={s.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} style={{ background: editId === v.id ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                {editId === v.id ? (
                  <>
                    <td style={s.td}><input style={s.input} defaultValue={v.display_name} onChange={e => setEditData({ ...editData, display_name: e.target.value })} /></td>
                    <td style={s.td}>
                      <select style={s.select} defaultValue={v.country} onChange={e => setEditData({ ...editData, country: e.target.value })}>
                        {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </td>
                    <td style={s.td}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{v.raw_name}</span></td>
                    <td style={s.td}><span style={s.badge(v.is_active ? 'green' : 'red')}>{v.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={s.btnSuccess} onClick={() => handleSave(v.id)}>Save</button>
                        <button style={s.btnSm} onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={s.td}>
                      <b style={{ color: 'var(--text-primary)' }}>{v.display_name}</b>
                      {v.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>📝 {v.notes}</div>}
                    </td>
                    <td style={s.td}><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.country}</span></td>
                    <td style={s.td}><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{v.raw_name}</span></td>
                    <td style={s.td}><span style={s.badge(v.is_active ? 'green' : 'red')}>{v.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={s.btnSm} onClick={() => { setEditId(v.id); setEditData({}) }}>Edit</button>
                        <button style={s.btnSm} onClick={() => handleToggle(v)}>{v.is_active ? 'Hide' : 'Show'}</button>
                        <button style={s.btnDanger} onClick={() => handleDelete(v.id, v.display_name)}>Remove</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No venues found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Country Manager Tab ───────────────────────────────────────────────
function CountriesTab() {
  const [countries, setCountries] = useState([])
  const [newCountry, setNewCountry] = useState({ name: '', code: '', sort_order: 99 })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [])
  const load = () => api.get('/admin-data/countries').then(r => setCountries(r.data)).catch(() => {})
  const flash = (m, isErr) => { isErr ? setErr(m) : setMsg(m); setTimeout(() => { setMsg(''); setErr('') }, 3000) }

  const handleAdd = async () => {
    if (!newCountry.name) { flash('Country name required.', true); return }
    try {
      await api.post('/admin-data/countries', newCountry)
      flash('Country added.'); setNewCountry({ name: '', code: '', sort_order: 99 }); load()
    } catch (e) { flash(e.response?.data?.detail || 'Failed.', true) }
  }

  const handleSave = async (id) => {
    await api.patch(`/admin-data/countries/${id}`, editData)
    flash('Updated.'); setEditId(null); load()
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return
    await api.delete(`/admin-data/countries/${id}`)
    flash('Removed.'); load()
  }

  const handleToggle = async (c) => {
    await api.patch(`/admin-data/countries/${c.id}`, { is_active: !c.is_active }); load()
  }

  return (
    <div>
      {msg && <div style={s.alert}>✓ {msg}</div>}
      {err && <div style={s.error}>⚠️ {err}</div>}

      <div style={s.card}>
        <div style={s.cardTitle}>➕ Add Country</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={s.label}>Country Name</label>
            <input style={s.input} value={newCountry.name} onChange={e => setNewCountry({ ...newCountry, name: e.target.value })} placeholder="e.g. Nepal" />
          </div>
          <div>
            <label style={s.label}>Code</label>
            <input style={s.input} value={newCountry.code} onChange={e => setNewCountry({ ...newCountry, code: e.target.value })} placeholder="e.g. NEP" />
          </div>
          <div>
            <label style={s.label}>Sort Order</label>
            <input style={s.input} type="number" value={newCountry.sort_order} onChange={e => setNewCountry({ ...newCountry, sort_order: parseInt(e.target.value) })} />
          </div>
          <button style={s.btn} onClick={handleAdd}>Add</button>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>🌍 Cricket Playing Nations ({countries.length})</div>
        <table style={s.table}>
          <thead><tr>
            <th style={s.th}>#</th><th style={s.th}>Country</th><th style={s.th}>Code</th>
            <th style={s.th}>Status</th><th style={s.th}>Actions</th>
          </tr></thead>
          <tbody>
            {countries.map((c, i) => (
              <tr key={c.id}>
                <td style={{ ...s.td, color: 'var(--text-muted)', width: '40px' }}>{i + 1}</td>
                {editId === c.id ? (
                  <>
                    <td style={s.td}><input style={s.input} defaultValue={c.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /></td>
                    <td style={s.td}><input style={{ ...s.input, width: '80px' }} defaultValue={c.code} onChange={e => setEditData({ ...editData, code: e.target.value })} /></td>
                    <td style={s.td}><span style={s.badge(c.is_active ? 'green' : 'red')}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={s.btnSuccess} onClick={() => handleSave(c.id)}>Save</button>
                        <button style={s.btnSm} onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={s.td}><b style={{ color: 'var(--text-primary)' }}>{c.name}</b></td>
                    <td style={s.td}><span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.code || '—'}</span></td>
                    <td style={s.td}><span style={s.badge(c.is_active ? 'green' : 'red')}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={s.btnSm} onClick={() => { setEditId(c.id); setEditData({}) }}>Edit</button>
                        <button style={s.btnSm} onClick={() => handleToggle(c)}>{c.is_active ? 'Disable' : 'Enable'}</button>
                        <button style={s.btnDanger} onClick={() => handleDelete(c.id, c.name)}>Remove</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Dataset Info Tab ──────────────────────────────────────────────────
function DatasetTab() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    api.get('/admin-data/dataset-info').then(r => setInfo(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardTitle}>📊 Current Dataset Statistics</div>
        {info ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Matches',    value: info.total_matches?.toLocaleString() },
              { label: 'SL Matches',       value: info.sl_matches?.toLocaleString() },
              { label: 'Total Deliveries', value: info.total_deliveries?.toLocaleString() },
              { label: 'Total Players',    value: info.total_players?.toLocaleString() },
              { label: 'Total Venues',     value: info.total_venues?.toLocaleString() },
              { label: 'Data From',        value: info.date_from },
              { label: 'Data To',          value: info.date_to },
            ].map(({ label, value }) => (
              <div key={label} style={s.statBox}>
                <span style={s.statVal}>{value}</span>
                <span style={s.statLbl}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Loading dataset info...</div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>🔄 Updating the Dataset</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '1rem' }}>To update the dataset with newer Cricsheet data, follow these steps:</p>
          <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>Download the latest <b style={{ color: '#f59e0b' }}>T20 International JSON</b> package from <b>cricsheet.org/downloads</b></li>
            <li>Extract the ZIP into <b style={{ color: '#f59e0b' }}>backend/data/new_matches/</b></li>
            <li>Run the import script from your backend CMD:
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem 1rem', marginTop: '0.4rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981' }}>
                venv\Scripts\python.exe scripts/import_cricsheet.py
              </div>
            </li>
            <li>Restart the backend server after import completes</li>
          </ol>
          <div style={{ marginTop: '1.25rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '0.9rem 1rem', fontSize: '0.82rem', color: '#fbbf24' }}>
            ⚠️ Dataset imports are handled via the backend pipeline to ensure data integrity. Direct browser uploads are not supported to prevent database corruption.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────────────
export default function AdminPanel() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')

  useEffect(() => {
    if (!isAdmin()) navigate('/')
  }, [])

  const tabs = [
    { id: 'users',     label: '👥 Users' },
    { id: 'venues',    label: '🏟️ Venues' },
    { id: 'countries', label: '🌍 Countries' },
    { id: 'dataset',   label: '📊 Dataset Info' },
  ]

  return (
    <div style={s.page}>
      <div style={s.maxW}>
        <div style={s.title}>⚙️ Admin Panel</div>
        <div style={s.subtitle}>System administration — user management, venue data, and dataset information</div>

        <div style={s.tabRow}>
          {tabs.map(t => (
            <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users'     && <UsersTab />}
        {tab === 'venues'    && <VenuesTab />}
        {tab === 'countries' && <CountriesTab />}
        {tab === 'dataset'   && <DatasetTab />}
      </div>
    </div>
  )
}

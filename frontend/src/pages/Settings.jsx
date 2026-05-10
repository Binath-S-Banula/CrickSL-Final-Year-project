import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [defaultEra, setDefaultEra] = useState(localStorage.getItem('cricksl_default_era') || '3');
  const [prefSaved, setPrefSaved] = useState(false);

  const handleSavePreferences = () => {
    localStorage.setItem('cricksl_default_era', defaultEra);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPassword.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwdError('New passwords do not match.'); return; }
    if (currentPassword === newPassword) { setPwdError('New password must be different from current password.'); return; }
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.detail || 'Failed to change password. Check your current password.');
    } finally { setPwdLoading(false); }
  };

  const roleColors = {
    admin:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '#ef4444' },
    analyst: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '#f59e0b' },
    coach:   { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: '#10b981' },
    player:  { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '#8b5cf6' },
  };
  const rc = roleColors[user?.role] || roleColors.analyst;

  const bg       = isDark ? '#0f172a'  : '#f1f5f9';
  const cardBg   = isDark ? '#1e293b'  : '#ffffff';
  const border   = isDark ? '#334155'  : '#e2e8f0';
  const textMain = isDark ? '#e2e8f0'  : '#0f172a';
  const textMuted= isDark ? '#64748b'  : '#94a3b8';
  const inputBg  = isDark ? '#0f172a'  : '#f8fafc';

  const s = {
    page:     { minHeight: '100vh', background: bg, padding: '2rem', fontFamily: "'Inter', sans-serif", color: textMain, transition: 'background 0.3s, color 0.3s' },
    maxW:     { maxWidth: '860px', margin: '0 auto' },
    title:    { fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' },
    subtitle: { color: textMuted, fontSize: '0.9rem', marginBottom: '2rem' },
    card:     { background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', transition: 'background 0.3s' },
    cardTitle:{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' },
    infoBox:  { background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${border}`, borderRadius: '10px', padding: '0.9rem 1rem' },
    infoLabel:{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' },
    infoValue:{ fontWeight: 600, color: textMain, fontSize: '0.9rem' },
    label:    { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' },
    input:    { width: '100%', background: inputBg, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, borderRadius: '8px', color: textMain, padding: '0.65rem 2.5rem 0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
    select:   { width: '100%', background: inputBg, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, borderRadius: '8px', color: textMain, padding: '0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
    btn:      { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' },
    btnSec:   { background: 'transparent', color: textMuted, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.7rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem', marginLeft: '0.75rem' },
    error:    { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' },
    success:  { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#6ee7b7', padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' },
    eyeBtn:   { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: '1rem', padding: 0 },
  };

  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 12) s++;
    return s;
  };
  const str = getStrength(newPassword);
  const strColor = ['', '#ef4444', '#f59e0b', '#10b981'][str];
  const strLabel = ['', 'Weak', 'Good', 'Strong'][str];

  const initials = (n) => {
    if (!n) return '?';
    const p = n.split(' ');
    return p.length > 1 ? p[0][0].toUpperCase() + p[p.length-1][0].toUpperCase() : n[0].toUpperCase();
  };

  return (
    <div style={s.page}>
      <div style={s.maxW}>
        <div style={s.title}>⚙️ Settings</div>
        <div style={s.subtitle}>Manage your profile, security, and preferences</div>

        {/* Profile */}
        <div style={s.card}>
          <div style={s.cardTitle}>👤 Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
              {initials(user?.username || '')}
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: textMain, marginBottom: '0.25rem' }}>{user?.username || '—'}</div>
              <div style={{ color: textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{user?.email || '—'}</div>
              <span style={{ display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                {user?.role || 'user'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            {[
              { label: 'Account Status', value: '● Active', vc: '#10b981' },
              { label: 'Role', value: (user?.role||'user').charAt(0).toUpperCase()+(user?.role||'user').slice(1) },
              { label: 'System', value: 'CrickSL v1.0' },
              { label: 'Access Level', value: user?.role==='admin' ? 'Full Access' : user?.role==='analyst' ? 'Analytics' : user?.role==='coach' ? 'Coaching Tools' : 'Player View' },
            ].map(({ label, value, vc }) => (
              <div key={label} style={s.infoBox}>
                <div style={s.infoLabel}>{label}</div>
                <div style={{ ...s.infoValue, color: vc || textMain }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div style={s.card}>
          <div style={s.cardTitle}>🎨 Appearance</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, color: textMain, marginBottom: '0.2rem' }}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
              <div style={{ fontSize: '0.8rem', color: textMuted }}>{isDark ? 'Easy on the eyes — ideal for night sessions and analysis work' : 'Clean and bright — ideal for presentations and daytime use'}</div>
            </div>
            <div
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{ width: '52px', height: '28px', borderRadius: '14px', background: isDark ? '#f59e0b' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: '3px', left: isDark ? '27px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={s.card}>
          <div style={s.cardTitle}>🏏 Preferences</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={s.label}>Default Era Filter (Players Dashboard)</label>
              <select style={s.select} value={defaultEra} onChange={e => setDefaultEra(e.target.value)}>
                <option value="0">All Time</option>
                <option value="1">Last 1 Year</option>
                <option value="3">Last 3 Years</option>
                <option value="5">Last 5 Years</option>
                <option value="10">Last 10 Years</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Default Theme</label>
              <select style={s.select} value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
          <button style={s.btn} onClick={handleSavePreferences}>Save Preferences</button>
          {prefSaved && <span style={{ display: 'inline-block', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', marginLeft: '0.75rem' }}>✓ Saved</span>}
        </div>

        {/* Change Password */}
        <div style={s.card}>
          <div style={s.cardTitle}>🔐 Change Password</div>
          <form onSubmit={handleChangePassword}>
            {pwdError   && <div style={s.error}>⚠️ {pwdError}</div>}
            {pwdSuccess && <div style={s.success}>✓ {pwdSuccess}</div>}
            <div style={{ marginBottom: '1rem' }}>
              <label style={s.label}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input style={s.input} type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password" />
                <button type="button" style={s.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={s.label}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={s.input} type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 8 characters" />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowNew(!showNew)}>{showNew ? '🙈' : '👁️'}</button>
                </div>
                {newPassword && <>
                  <div style={{ height: '4px', borderRadius: '2px', marginTop: '6px', background: strColor, width: str===1?'33%':str===2?'66%':str===3?'100%':'0%', transition: 'all 0.3s' }} />
                  <div style={{ fontSize: '0.7rem', color: strColor, marginTop: '3px' }}>{strLabel}</div>
                </>}
              </div>
              <div>
                <label style={s.label}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={s.input} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password" />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
                {confirmPassword && <div style={{ fontSize: '0.75rem', marginTop: '4px', color: newPassword===confirmPassword ? '#10b981' : '#ef4444' }}>{newPassword===confirmPassword ? '✓ Passwords match' : 'Passwords do not match'}</div>}
              </div>
            </div>
            <button style={s.btn} type="submit" disabled={pwdLoading}>{pwdLoading ? 'Updating…' : 'Update Password'}</button>
            <button type="button" style={s.btnSec} onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwdError(''); setPwdSuccess(''); }}>Clear</button>
          </form>
        </div>

        {/* About */}
        <div style={s.card}>
          <div style={s.cardTitle}>ℹ️ About CrickSL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[['System','CrickSL v1.0'],['Dataset','4,991 Matches'],['Deliveries','1.1M Records'],['ML Accuracy','72.7%'],['ML Model','Random Forest'],['Format','T20 International']].map(([label, value]) => (
              <div key={label} style={s.infoBox}>
                <div style={s.infoLabel}>{label}</div>
                <div style={s.infoValue}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

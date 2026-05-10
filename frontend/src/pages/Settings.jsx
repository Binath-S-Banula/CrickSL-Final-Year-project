import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

// Theme stored in localStorage
const getTheme = () => localStorage.getItem('cricksl_theme') || 'dark';
const setThemeStorage = (t) => localStorage.setItem('cricksl_theme', t);

export default function Settings() {
  const { user } = useAuth();

  // Theme
  const [theme, setTheme] = useState(getTheme());

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preferences
  const [defaultEra, setDefaultEra] = useState(
    localStorage.getItem('cricksl_default_era') || '3'
  );
  const [prefSaved, setPrefSaved] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setThemeStorage(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cricksl_default_era', defaultEra);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPwdError('New password must be different from current password.');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.detail || 'Failed to change password. Check your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const roleColors = {
    admin:    { bg: 'rgba(239,68,68,0.15)',   color: '#f87171',  border: '#ef4444' },
    analyst:  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24',  border: '#f59e0b' },
    coach:    { bg: 'rgba(16,185,129,0.15)',  color: '#34d399',  border: '#10b981' },
    player:   { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa',  border: '#8b5cf6' },
  };
  const rc = roleColors[user?.role] || roleColors.analyst;

  const s = {
    page: {
      minHeight: '100vh',
      background: isDark ? '#0f172a' : '#f1f5f9',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
      color: isDark ? '#e2e8f0' : '#1e293b',
      transition: 'background 0.3s, color 0.3s',
    },
    maxW: {
      maxWidth: '860px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '2rem',
      fontWeight: 700,
      color: '#f59e0b',
      marginBottom: '0.25rem',
    },
    subtitle: {
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '0.9rem',
    },
    card: {
      background: isDark ? '#1e293b' : '#ffffff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: '16px',
      padding: '1.75rem',
      marginBottom: '1.5rem',
      transition: 'background 0.3s',
    },
    cardTitle: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '1.15rem',
      fontWeight: 700,
      color: '#f59e0b',
      marginBottom: '1.25rem',
      paddingBottom: '0.75rem',
      borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    profileRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
    },
    avatar: {
      width: '72px',
      height: '72px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #1e40af, #f59e0b)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#fff',
      fontFamily: "'Rajdhani', sans-serif",
      flexShrink: 0,
      boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '1.5rem',
      fontWeight: 700,
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginBottom: '0.25rem',
    },
    profileEmail: {
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    roleBadge: {
      display: 'inline-block',
      padding: '0.2rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: rc.bg,
      color: rc.color,
      border: `1px solid ${rc.border}`,
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginTop: '1.25rem',
    },
    infoBox: {
      background: isDark ? '#0f172a' : '#f8fafc',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: '10px',
      padding: '0.9rem 1rem',
    },
    infoLabel: {
      fontSize: '0.7rem',
      color: isDark ? '#64748b' : '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.3rem',
    },
    infoValue: {
      fontWeight: 600,
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontSize: '0.9rem',
    },
    // Theme toggle
    themeRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
    },
    themeInfo: {},
    themeLabel: {
      fontWeight: 600,
      color: isDark ? '#e2e8f0' : '#1e293b',
      marginBottom: '0.2rem',
    },
    themeDesc: {
      fontSize: '0.8rem',
      color: isDark ? '#64748b' : '#94a3b8',
    },
    toggleTrack: (on) => ({
      width: '52px',
      height: '28px',
      borderRadius: '14px',
      background: on ? '#f59e0b' : (isDark ? '#334155' : '#cbd5e1'),
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.3s',
      flexShrink: 0,
    }),
    toggleThumb: (on) => ({
      position: 'absolute',
      top: '3px',
      left: on ? '27px' : '3px',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    }),
    // Form
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
    },
    formGridFull: {
      gridColumn: '1 / -1',
    },
    label: {
      display: 'block',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: isDark ? '#94a3b8' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.4rem',
    },
    inputWrap: {
      position: 'relative',
    },
    input: {
      width: '100%',
      background: isDark ? '#0f172a' : '#f8fafc',
      border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
      borderRadius: '8px',
      color: isDark ? '#f1f5f9' : '#0f172a',
      padding: '0.65rem 2.5rem 0.65rem 0.9rem',
      fontSize: '0.9rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    eyeBtn: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '1rem',
      padding: 0,
    },
    strengthBar: (strength) => ({
      height: '4px',
      borderRadius: '2px',
      marginTop: '6px',
      background: strength === 0 ? (isDark ? '#334155' : '#e2e8f0') :
                  strength === 1 ? '#ef4444' :
                  strength === 2 ? '#f59e0b' : '#10b981',
      width: strength === 0 ? '0%' : strength === 1 ? '33%' : strength === 2 ? '66%' : '100%',
      transition: 'all 0.3s',
    }),
    strengthText: (strength) => ({
      fontSize: '0.7rem',
      color: strength === 1 ? '#ef4444' : strength === 2 ? '#f59e0b' : '#10b981',
      marginTop: '3px',
    }),
    btn: {
      background: '#f59e0b',
      color: '#0f172a',
      border: 'none',
      borderRadius: '8px',
      padding: '0.7rem 1.5rem',
      fontSize: '0.9rem',
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'opacity 0.2s',
    },
    btnSecondary: {
      background: 'transparent',
      color: isDark ? '#94a3b8' : '#64748b',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: '0.7rem 1.5rem',
      fontSize: '0.9rem',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '1rem',
      marginLeft: '0.75rem',
    },
    error: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px',
      color: '#fca5a5',
      padding: '0.75rem',
      fontSize: '0.85rem',
      marginBottom: '1rem',
    },
    success: {
      background: 'rgba(16,185,129,0.1)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: '8px',
      color: '#6ee7b7',
      padding: '0.75rem',
      fontSize: '0.85rem',
      marginBottom: '1rem',
    },
    select: {
      width: '100%',
      background: isDark ? '#0f172a' : '#f8fafc',
      border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
      borderRadius: '8px',
      color: isDark ? '#f1f5f9' : '#0f172a',
      padding: '0.65rem 0.9rem',
      fontSize: '0.9rem',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
    },
    prefRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      alignItems: 'end',
    },
    savedBadge: {
      display: 'inline-block',
      background: 'rgba(16,185,129,0.15)',
      border: '1px solid #10b981',
      color: '#34d399',
      borderRadius: '6px',
      padding: '0.4rem 0.9rem',
      fontSize: '0.8rem',
      fontWeight: 600,
      marginTop: '1rem',
      marginLeft: '0.75rem',
    },
  };

  // Password strength
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 12) score++;
    return score;
  };
  const strength = getStrength(newPassword);
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength];

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <div style={s.page}>
      <div style={s.maxW}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.title}>⚙️ Settings</div>
          <div style={s.subtitle}>Manage your profile, security, and preferences</div>
        </div>

        {/* Profile Card */}
        <div style={s.card}>
          <div style={s.cardTitle}>👤 Profile</div>
          <div style={s.profileRow}>
            <div style={s.avatar}>{initials(user?.username || '')}</div>
            <div style={s.profileInfo}>
              <div style={s.profileName}>{user?.username || '—'}</div>
              <div style={s.profileEmail}>{user?.email || '—'}</div>
              <span style={s.roleBadge}>{user?.role || 'user'}</span>
            </div>
          </div>
          <div style={s.infoGrid}>
            <div style={s.infoBox}>
              <div style={s.infoLabel}>Account Status</div>
              <div style={{ ...s.infoValue, color: '#10b981' }}>● Active</div>
            </div>
            <div style={s.infoBox}>
              <div style={s.infoLabel}>Role</div>
              <div style={s.infoValue}>{(user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1)}</div>
            </div>
            <div style={s.infoBox}>
              <div style={s.infoLabel}>System</div>
              <div style={s.infoValue}>CrickSL v1.0</div>
            </div>
            <div style={s.infoBox}>
              <div style={s.infoLabel}>Access Level</div>
              <div style={s.infoValue}>
                {user?.role === 'admin' ? 'Full Access' :
                 user?.role === 'analyst' ? 'Analytics' :
                 user?.role === 'coach' ? 'Coaching Tools' : 'Player View'}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Card */}
        <div style={s.card}>
          <div style={s.cardTitle}>🎨 Appearance</div>
          <div style={s.themeRow}>
            <div style={s.themeInfo}>
              <div style={s.themeLabel}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
              <div style={s.themeDesc}>
                {isDark
                  ? 'Easy on the eyes — ideal for night sessions and analysis work'
                  : 'Clean and bright — ideal for presentations and daytime use'}
              </div>
            </div>
            <div style={s.toggleTrack(!isDark)} onClick={handleThemeToggle}>
              <div style={s.toggleThumb(!isDark)} />
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div style={s.card}>
          <div style={s.cardTitle}>🏏 Preferences</div>
          <div style={s.prefRow}>
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
          <div>
            <button style={s.btn} onClick={handleSavePreferences}>Save Preferences</button>
            {prefSaved && <span style={s.savedBadge}>✓ Saved</span>}
          </div>
        </div>

        {/* Change Password Card */}
        <div style={s.card}>
          <div style={s.cardTitle}>🔐 Change Password</div>
          <form onSubmit={handleChangePassword}>
            {pwdError && <div style={s.error}>⚠️ {pwdError}</div>}
            {pwdSuccess && <div style={s.success}>✓ {pwdSuccess}</div>}

            <div style={{ marginBottom: '1rem' }}>
              <label style={s.label}>Current Password</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={s.formGrid}>
              <div>
                <label style={s.label}>New Password</label>
                <div style={s.inputWrap}>
                  <input
                    style={s.input}
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowNew(!showNew)}>
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
                {newPassword && (
                  <>
                    <div style={s.strengthBar(strength)} />
                    <div style={s.strengthText(strength)}>{strengthLabel}</div>
                  </>
                )}
              </div>

              <div>
                <label style={s.label}>Confirm New Password</label>
                <div style={s.inputWrap}>
                  <input
                    style={s.input}
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                    Passwords do not match
                  </div>
                )}
                {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>
            </div>

            <div>
              <button style={s.btn} type="submit" disabled={pwdLoading}>
                {pwdLoading ? 'Updating…' : 'Update Password'}
              </button>
              <button type="button" style={s.btnSecondary}
                onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwdError(''); setPwdSuccess(''); }}>
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* About Card */}
        <div style={s.card}>
          <div style={s.cardTitle}>ℹ️ About CrickSL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'System', value: 'CrickSL v1.0' },
              { label: 'Dataset', value: '4,991 Matches' },
              { label: 'Deliveries', value: '1.1M Records' },
              { label: 'ML Accuracy', value: '72.7%' },
              { label: 'ML Model', value: 'Random Forest' },
              { label: 'Format', value: 'T20 International' },
            ].map(({ label, value }) => (
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

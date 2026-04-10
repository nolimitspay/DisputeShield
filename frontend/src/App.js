import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from './api';

/* ========================================================================
   CONTEXT & AUTH
   ======================================================================== */
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nld_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('nld_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me').then(res => {
        setUser(res.data.user || res.data);
        localStorage.setItem('nld_user', JSON.stringify(res.data.user || res.data));
      }).catch(() => {
        setToken(null); setUser(null);
        localStorage.removeItem('nld_token');
        localStorage.removeItem('nld_user');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const t = res.data.token;
    const u = res.data.user;
    localStorage.setItem('nld_token', t);
    localStorage.setItem('nld_user', JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const signup = async (data) => {
    const res = await api.post('/api/auth/signup', data);
    const t = res.data.token;
    const u = res.data.user;
    localStorage.setItem('nld_token', t);
    localStorage.setItem('nld_user', JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('nld_token');
    localStorage.removeItem('nld_user');
    setToken(null); setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem('nld_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f6fa' }}><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/* ========================================================================
   SVG ICONS
   ======================================================================== */
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  disputes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  alerts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  mids: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  notifications: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  filter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  gear: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  creditCard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  arrowUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  arrowDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  columns: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>
    </svg>
  ),
  refreshCw: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

/* ========================================================================
   GLOBAL STYLES (CSS-in-JS)
   ======================================================================== */
const COLORS = {
  sidebarBg: '#2d3436',
  sidebarHover: '#3d4446',
  sidebarText: '#b2bec3',
  sidebarActive: '#22c55e',
  pageBg: '#f5f6fa',
  white: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f0f0f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  green: '#22c55e',
  greenLight: '#dcfce7',
  greenDark: '#16a34a',
  red: '#ef4444',
  redLight: '#fee2e2',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  yellow: '#f59e0b',
  yellowLight: '#fef3c7',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  orange: '#f97316',
  orangeLight: '#ffedd5',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  shadowLg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
  radius: '12px',
  radiusSm: '8px',
  radiusXs: '6px',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

/* ========================================================================
   SHARED COMPONENTS
   ======================================================================== */
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.green}`, borderRadius: '50%',
        animation: 'nld-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes nld-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function Badge({ children, variant = 'green', style: extraStyle }) {
  const variants = {
    green: { background: COLORS.greenLight, color: COLORS.greenDark },
    red: { background: COLORS.redLight, color: COLORS.red },
    blue: { background: COLORS.blueLight, color: COLORS.blue },
    yellow: { background: COLORS.yellowLight, color: COLORS.yellow },
    purple: { background: COLORS.purpleLight, color: COLORS.purple },
    gray: { background: '#f1f5f9', color: COLORS.textSecondary },
    orange: { background: COLORS.orangeLight, color: COLORS.orange },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      textTransform: 'uppercase', ...variants[variant], ...extraStyle,
    }}>
      {children}
    </span>
  );
}

function Card({ children, style, onClick, hoverable }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: COLORS.white, borderRadius: COLORS.radius,
        boxShadow: hov && hoverable ? COLORS.shadowMd : COLORS.shadow,
        border: `1px solid ${COLORS.borderLight}`,
        transition: 'box-shadow 0.2s, transform 0.2s',
        transform: hov && hoverable ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, variant = 'primary', size = 'md', style, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  const variants = {
    primary: { background: hov ? COLORS.greenDark : COLORS.green, color: '#fff', border: 'none' },
    secondary: { background: hov ? '#f1f5f9' : COLORS.white, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    ghost: { background: hov ? '#f8fafc' : 'transparent', color: COLORS.textSecondary, border: 'none' },
    danger: { background: hov ? '#dc2626' : COLORS.red, color: '#fff', border: 'none' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: COLORS.radiusSm, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
        ...variants[variant], ...sizes[size], ...style,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? COLORS.green : '#d1d5db',
          transition: 'background 0.2s', position: 'relative', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>}
    </label>
  );
}

function TabBar({ tabs, active, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, ...style }}>
      {tabs.map(t => (
        <button
          key={t.key || t}
          onClick={() => onChange(t.key || t)}
          style={{
            padding: '10px 16px', fontSize: 13, fontWeight: 500,
            color: (t.key || t) === active ? COLORS.green : COLORS.textSecondary,
            borderBottom: (t.key || t) === active ? `2px solid ${COLORS.green}` : '2px solid transparent',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'all 0.15s', marginBottom: -1,
          }}
        >
          {t.label || t}
          {t.count !== undefined && (
            <span style={{ marginLeft: 6, background: '#f1f5f9', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, style, placeholder }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 32px 8px 12px', fontSize: 13, borderRadius: COLORS.radiusSm,
        border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
        background: `${COLORS.white} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 10px center`,
        appearance: 'none', cursor: 'pointer', outline: 'none',
        ...style,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );
}

function SearchInput({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }}>
        {Icons.search}
      </span>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 12px 8px 34px', fontSize: 13,
          border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm,
          outline: 'none', color: COLORS.textPrimary, background: COLORS.white,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function DateRangePicker({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: 13, color: COLORS.textSecondary, cursor: 'pointer', background: COLORS.white }}>
      <span style={{ color: COLORS.textMuted }}>{Icons.calendar}</span>
      <span>{value || 'Last 30 days'}</span>
      <span style={{ color: COLORS.textMuted, marginLeft: 4 }}>{Icons.chevronDown}</span>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
      {icon && <div style={{ marginBottom: 12, opacity: 0.4 }}>{icon}</div>}
      <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}

function ProgressBar({ percent, height = 6, color = COLORS.green, style }) {
  return (
    <div style={{ width: '100%', background: '#e5e7eb', borderRadius: height / 2, height, overflow: 'hidden', ...style }}>
      <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: height / 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

/* ========================================================================
   SIDEBAR
   ======================================================================== */
function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Icons.dashboard },
    ...(user?.role === 'admin' ? [{ path: '/admin/clients', label: 'Clients', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }] : []),
    { path: '/disputes', label: 'Disputes', icon: Icons.disputes },
    { path: '/alerts', label: 'Chargeback Alerts', icon: Icons.alerts },
    { path: '/mids', label: 'MIDs', icon: Icons.mids },
    { path: '/notifications', label: 'Notifications', icon: Icons.notifications },
  ];

  const settingsItems = [
    { path: '/settings/profile', label: 'Profile' },
    { path: '/settings/processors', label: 'Connected Processors' },
    { path: '/settings/onboarding', label: 'Onboarding' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      width: 250, minHeight: '100vh', background: COLORS.sidebarBg,
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff' }}>{Icons.shield}</span>
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>NoLimitsDisputes</div>
          <div style={{ color: COLORS.sidebarText, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Chargeback Prevention</div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => (
          <Link
            key={item.path} to={item.path}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: COLORS.radiusSm, textDecoration: 'none',
              color: isActive(item.path) ? '#fff' : COLORS.sidebarText,
              background: isActive(item.path) ? 'rgba(34,197,94,0.12)' : 'transparent',
              fontSize: 13, fontWeight: isActive(item.path) ? 600 : 400,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = COLORS.sidebarHover; }}
            onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: isActive(item.path) ? COLORS.sidebarActive : COLORS.sidebarText, display: 'flex' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Settings with submenu */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%',
              borderRadius: COLORS.radiusSm, border: 'none', textAlign: 'left',
              color: isActive('/settings') ? '#fff' : COLORS.sidebarText,
              background: isActive('/settings') ? 'rgba(34,197,94,0.12)' : 'transparent',
              fontSize: 13, fontWeight: isActive('/settings') ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{ color: isActive('/settings') ? COLORS.sidebarActive : COLORS.sidebarText, display: 'flex' }}>{Icons.settings}</span>
            <span style={{ flex: 1 }}>Settings</span>
            <span style={{ transform: settingsOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'flex' }}>{Icons.chevronRight}</span>
          </button>
          {settingsOpen && (
            <div style={{ paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {settingsItems.map(si => (
                <Link
                  key={si.path} to={si.path}
                  style={{
                    padding: '7px 12px', fontSize: 12, textDecoration: 'none', borderRadius: COLORS.radiusXs,
                    color: location.pathname === si.path ? '#fff' : COLORS.sidebarText,
                    background: location.pathname === si.path ? 'rgba(34,197,94,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {si.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User / Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: COLORS.green, display: 'flex' }}>{Icons.user}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email || 'User'}
            </div>
            <div style={{ color: COLORS.sidebarText, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%',
            borderRadius: COLORS.radiusSm, border: 'none', background: 'transparent',
            color: COLORS.sidebarText, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.sidebarHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {Icons.logout}
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

/* ========================================================================
   PAGE HEADER
   ======================================================================== */
function PageHeader({ title, subtitle, children }) {
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.textSecondary }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {children}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm,
              background: COLORS.white, cursor: 'pointer', fontSize: 13, color: COLORS.textPrimary,
            }}
          >
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: COLORS.green, display: 'flex', transform: 'scale(0.7)' }}>{Icons.user}</span>
            </span>
            <span style={{ fontWeight: 500 }}>{user?.company || user?.name || 'My Company'}</span>
            {Icons.chevronDown}
          </button>
          {accountOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4, background: COLORS.white,
              borderRadius: COLORS.radiusSm, boxShadow: COLORS.shadowLg, border: `1px solid ${COLORS.border}`,
              minWidth: 180, zIndex: 50, padding: 4,
            }}>
              <div style={{ padding: '8px 12px', fontSize: 12, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Switch Account</div>
              <button style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: COLORS.textPrimary, cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {user?.company || 'Primary Company'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   MAIN LAYOUT
   ======================================================================== */
function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.pageBg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '24px 32px 32px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}


/* ========================================================================
   PAGE: ADMIN CLIENTS (admin only)
   ======================================================================== */
function AdminClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', plan: 'starter' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editClient, setEditClient] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/clients');
      setClients(data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  if (user?.role !== 'admin') return <div style={{ padding: 40, color: '#666' }}>Access denied</div>;

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await api.post('/api/admin/clients', form);
      setForm({ name: '', email: '', password: '', company: '', plan: 'starter' });
      setShowCreate(false);
      fetchClients();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create client');
    }
    setCreating(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client "${name}" and ALL their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/clients/${id}`);
      fetchClients();
    } catch { }
  };

  const handleUpdatePlan = async (id, plan) => {
    try {
      await api.put(`/api/admin/clients/${id}`, { plan });
      fetchClients();
    } catch { }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
    borderRadius: COLORS.radiusSm, outline: 'none', color: COLORS.textPrimary, boxSizing: 'border-box',
    background: '#fff',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>Clients</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textSecondary }}>Manage your merchant accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '10px 20px', background: COLORS.green, color: '#fff', border: 'none',
          borderRadius: COLORS.radiusSm, cursor: 'pointer', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Client
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL CLIENTS', value: clients.length, color: COLORS.green },
          { label: 'TOTAL ALERTS', value: clients.reduce((s, c) => s + c.alertsCount, 0) },
          { label: 'TOTAL PREVENTED', value: clients.reduce((s, c) => s + c.preventedCount, 0), color: COLORS.green },
          { label: 'MONEY SAVED', value: '$' + clients.reduce((s, c) => s + c.moneySaved, 0).toLocaleString() },
        ].map((s, i) => (
          <Card key={i} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color || COLORS.textPrimary }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Create Client Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreate(false)}>
          <Card style={{ width: 460, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>New Client</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: COLORS.textSecondary }}>Create a new merchant account</p>
            {formError && <div style={{ padding: '10px 14px', borderRadius: 6, background: COLORS.redLight, color: COLORS.red, fontSize: 13, marginBottom: 16 }}>{formError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="John Doe" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="client@company.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} style={inputStyle} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>Company</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} placeholder="Company name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 4 }}>Plan</label>
                  <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={inputStyle}>
                    <option value="starter">Starter ($49/mo)</option>
                    <option value="pro">Pro ($149/mo)</option>
                    <option value="enterprise">Enterprise ($399/mo)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" disabled={creating} style={{ flex: 1, padding: '10px', background: COLORS.green, color: '#fff', border: 'none', borderRadius: COLORS.radiusSm, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {creating ? 'Creating...' : 'Create Client'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', background: '#fff', border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, borderRadius: COLORS.radiusSm, cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Clients Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
              {['Client', 'Company', 'Plan', 'Alerts', 'Prevented', 'Saved', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: COLORS.textSecondary }}>Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: COLORS.textSecondary }}>No clients yet. Click "Add Client" to create your first merchant.</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{c.email}</div>
                </td>
                <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{c.company || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select value={c.plan} onChange={e => handleUpdatePlan(c.id, e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 12, color: COLORS.textPrimary, background: '#fff', cursor: 'pointer' }}>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: COLORS.textPrimary }}>{c.alertsCount}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: COLORS.green }}>{c.preventedCount}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: COLORS.textPrimary }}>${c.moneySaved.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.textSecondary }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleDelete(c.id, c.name)} style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${COLORS.border}`, color: COLORS.red, borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ========================================================================
   PAGE: HOME / DASHBOARD
   ======================================================================== */
function HomePage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activity, setActivity] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/api/dashboard/chart').then(r => setChartData(r.data.data || r.data || [])).catch(() => {});
    api.get('/api/dashboard/activity').then(r => setActivity(r.data.activities || r.data || [])).catch(() => {});
    api.get('/api/merchants/onboarding-status').then(r => setOnboarding(r.data)).catch(() => {});
  }, []);

  const tabs = ['Overview', 'Alerts', 'Chargebacks', 'MIDs'];

  const onboardingSteps = [
    { id: 1, title: 'Setup chargeback alerts', description: 'Configure RDR, Ethoca, and CDRN to prevent chargebacks before they happen.', done: true },
    { id: 2, title: 'Connect your gateway or CRM', description: 'Link Stripe, Square, PayPal, or your CRM to start importing order data.', done: true },
    { id: 3, title: 'Connect your processor to load chargebacks', description: 'Connect your payment processor so we can import chargebacks automatically.', done: false },
    { id: 4, title: 'Prevent more fraud with AI', description: 'Enable our AI fraud prevention engine to block fraudulent orders in real time.', done: false },
    { id: 5, title: 'Check out our knowledge base', description: 'Learn best practices for chargeback management and prevention strategies.', done: false },
  ];
  const stepsCompleted = onboardingSteps.filter(s => s.done).length;

  const faqs = [
    { q: 'How long do alerts take to go live?', a: 'Alerts typically go live within 24-48 hours after configuration. RDR alerts may take up to 72 hours due to Visa network enrollment.' },
    { q: 'What are chargeback alerts?', a: 'Chargeback alerts notify you when a cardholder disputes a transaction, giving you the opportunity to refund before it becomes a chargeback.' },
    { q: 'When will you respond to our chargebacks?', a: 'Our automated system responds to chargebacks within hours of receipt. Manual reviews are handled within 1 business day.' },
    { q: 'Why does RDR show as a lost chargeback?', a: 'RDR (Rapid Dispute Resolution) automatically refunds the cardholder to prevent the chargeback. While it appears as a loss, it avoids the chargeback fees and ratio impact.' },
    { q: 'Where can I find an ARN?', a: 'The Acquirer Reference Number (ARN) can be found in the dispute details page or in your processor dashboard under transaction details.' },
    { q: 'How can I increase chargeback alert coverage?', a: 'Enable all three alert networks (RDR, Ethoca, CDRN) and ensure your MID descriptors are correctly mapped for maximum coverage.' },
    { q: 'How can I activate alerts on more card networks?', a: 'Navigate to Chargeback Alerts > Settings to enable additional card networks and configure alert preferences for each.' },
  ];

  const overviewStats = [
    { label: 'Total Alerts', value: stats?.totalAlerts ?? 0, change: '+12%', up: true, color: COLORS.green },
    { label: 'Chargebacks Prevented', value: stats?.chargebacksPrevented ?? 0, change: '+8%', up: true, color: COLORS.blue },
    { label: 'Win Rate', value: `${stats?.winRate ?? 0}%`, change: '+3%', up: true, color: COLORS.purple },
    { label: 'Money Saved', value: `$${(stats?.moneySaved ?? 0).toLocaleString()}`, change: '+15%', up: true, color: COLORS.green },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" subtitle="Monitor your chargeback prevention performance">
        <Select value="" onChange={() => {}} options={['All MIDs', 'MID-001', 'MID-002']} style={{ minWidth: 140 }} />
        <DateRangePicker />
      </PageHeader>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }} />

      {activeTab === 'Overview' && (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {overviewStats.map((s, i) => (
              <Card key={i} style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary }}>{s.value}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500, color: s.up ? COLORS.green : COLORS.red }}>
                    {s.up ? Icons.arrowUp : Icons.arrowDown} {s.change}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Content: Getting Started + FAQs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
            {/* Getting Started */}
            <Card style={{ padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>Getting Started Guide</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.textSecondary }}>{stepsCompleted} out of {onboardingSteps.length} Steps Completed</p>
                </div>
                <ProgressBar percent={(stepsCompleted / onboardingSteps.length) * 100} style={{ width: 120 }} />
              </div>
              <div style={{ padding: '8px 0' }}>
                {onboardingSteps.map((step) => (
                  <div key={step.id}>
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', width: '100%',
                        border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: step.done ? COLORS.green : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {step.done ? <span style={{ color: '#fff', display: 'flex' }}>{Icons.check}</span>
                          : <span style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: 600 }}>{step.id}</span>}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: 500, textDecoration: step.done ? 'line-through' : 'none', opacity: step.done ? 0.6 : 1 }}>
                        {step.title}
                      </span>
                      <span style={{ transform: expandedStep === step.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: COLORS.textMuted, display: 'flex' }}>
                        {Icons.chevronDown}
                      </span>
                    </button>
                    {expandedStep === step.id && (
                      <div style={{ padding: '0 24px 12px 60px', fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                        {step.description}
                        {!step.done && (
                          <div style={{ marginTop: 8 }}>
                            <Button size="sm">Get Started</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* FAQs */}
            <Card style={{ padding: 0, alignSelf: 'start' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>FAQs</h3>
              </div>
              <div>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none' }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', width: '100%',
                        border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
                        color: COLORS.textPrimary, fontWeight: 500,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ flex: 1 }}>{faq.q}</span>
                      <span style={{ transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: COLORS.textMuted, display: 'flex', flexShrink: 0 }}>
                        {Icons.chevronDown}
                      </span>
                    </button>
                    {expandedFaq === i && (
                      <div style={{ padding: '0 24px 12px', fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>Alert Trends</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.length ? chartData : [
                  { name: 'Jan', alerts: 12, chargebacks: 8 }, { name: 'Feb', alerts: 19, chargebacks: 6 },
                  { name: 'Mar', alerts: 24, chargebacks: 5 }, { name: 'Apr', alerts: 32, chargebacks: 4 },
                  { name: 'May', alerts: 28, chargebacks: 3 }, { name: 'Jun', alerts: 36, chargebacks: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow }} />
                  <Line type="monotone" dataKey="alerts" stroke={COLORS.green} strokeWidth={2} dot={{ r: 4, fill: COLORS.green }} />
                  <Line type="monotone" dataKey="chargebacks" stroke={COLORS.red} strokeWidth={2} dot={{ r: 4, fill: COLORS.red }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Onboarding progress bar */}
          <Card style={{ padding: '16px 24px', marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>Complete Onboarding</div>
            <ProgressBar percent={40} style={{ flex: 1 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, whiteSpace: 'nowrap' }}>40%</div>
          </Card>
        </>
      )}

      {activeTab === 'Alerts' && (
        <Card style={{ padding: 40 }}>
          <EmptyState icon={Icons.alerts} title="Alerts Overview" subtitle="Your alert activity will appear here once alerts are configured." />
        </Card>
      )}
      {activeTab === 'Chargebacks' && (
        <Card style={{ padding: 40 }}>
          <EmptyState icon={Icons.disputes} title="Chargebacks Overview" subtitle="Your chargeback data will appear here once processors are connected." />
        </Card>
      )}
      {activeTab === 'MIDs' && (
        <Card style={{ padding: 40 }}>
          <EmptyState icon={Icons.mids} title="MIDs Overview" subtitle="Your MID performance data will appear here." />
        </Card>
      )}
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: DISPUTES
   ======================================================================== */
function DisputesPage() {
  const [activeTab, setActiveTab] = useState('All Disputes');
  const [autoRespond, setAutoRespond] = useState(true);
  const [search, setSearch] = useState('');
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/alerts').then(r => {
      setDisputes(r.data.alerts || r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'All Disputes', label: 'All Disputes', count: disputes.length },
    { key: 'RDR', label: 'RDR', count: disputes.filter(d => d.type === 'RDR').length },
    { key: 'Ethoca', label: 'Ethoca', count: disputes.filter(d => d.type === 'Ethoca').length },
    { key: 'CDRN', label: 'CDRN', count: disputes.filter(d => d.type === 'CDRN').length },
    { key: 'PayPal Alerts', label: 'PayPal Alerts', count: 0 },
    { key: 'Action Needed', label: 'Action Needed', count: disputes.filter(d => d.status === 'action_needed').length },
  ];

  const statusCards = [
    { label: 'Action Needed', count: disputes.filter(d => d.status === 'action_needed').length, color: COLORS.green, bgColor: COLORS.greenLight },
    { label: 'Processing', count: disputes.filter(d => d.status === 'processing').length, color: COLORS.blue, bgColor: COLORS.blueLight },
    { label: 'Bank Review', count: disputes.filter(d => d.status === 'bank_review').length, color: COLORS.yellow, bgColor: COLORS.yellowLight },
    { label: 'Buyer Review', count: disputes.filter(d => d.status === 'buyer_review').length, color: COLORS.purple, bgColor: COLORS.purpleLight },
  ];

  const sampleDisputes = disputes.length ? disputes : [
    { id: 'DSP-001', orderNumber: 'ORD-4521', reason: 'Product not received', postedDate: '2025-01-15', dueDate: '2025-02-14', amount: 89.99, status: 'action_needed', type: 'Ethoca' },
    { id: 'DSP-002', orderNumber: 'ORD-4498', reason: 'Unauthorized transaction', postedDate: '2025-01-14', dueDate: '2025-02-13', amount: 249.00, status: 'processing', type: 'RDR' },
    { id: 'DSP-003', orderNumber: 'ORD-4477', reason: 'Not as described', postedDate: '2025-01-13', dueDate: '2025-02-12', amount: 34.50, status: 'bank_review', type: 'CDRN' },
    { id: 'DSP-004', orderNumber: 'ORD-4456', reason: 'Duplicate charge', postedDate: '2025-01-12', dueDate: '2025-02-11', amount: 125.00, status: 'processing', type: 'Ethoca' },
    { id: 'DSP-005', orderNumber: 'ORD-4432', reason: 'Credit not processed', postedDate: '2025-01-11', dueDate: '2025-02-10', amount: 67.80, status: 'buyer_review', type: 'RDR' },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Disputes" subtitle="Manage and respond to chargebacks">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Automated Chargeback Responding</span>
          <Toggle checked={autoRespond} onChange={setAutoRespond} />
        </div>
      </PageHeader>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statusCards.map((sc, i) => (
          <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 3, background: sc.color }} />
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{sc.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>{sc.count}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} style={{ marginBottom: 0 }} />

      {/* Toolbar */}
      <Card style={{ borderRadius: `0 0 ${COLORS.radius} ${COLORS.radius}`, borderTop: 'none', padding: '12px 20px', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="ghost" size="sm">{Icons.columns} <span>Customize Columns</span></Button>
          <SearchInput value={search} onChange={setSearch} placeholder="Search disputes..." style={{ width: 240 }} />
          <div style={{ flex: 1 }} />
          <Button variant="secondary" size="sm">{Icons.download} <span>Export</span></Button>
          <DateRangePicker />
          <Button variant="secondary" size="sm">{Icons.filter} <span>Filter</span></Button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ marginTop: 16, overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Order Number', 'Dispute ID', 'Reason', 'Posted Date', 'Due Date', 'Dispute Amount', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleDisputes.map((d, i) => (
                  <tr key={d.id || i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.blue, fontWeight: 500 }}>{d.orderNumber || d.order_number || '--'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{d.id || d.disputeId || '--'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{d.reason || '--'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{d.postedDate || d.posted_date || d.createdAt || '--'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{d.dueDate || d.due_date || '--'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>${(d.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Button variant="secondary" size="sm">Add Order</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sampleDisputes.length === 0 && (
              <EmptyState icon={Icons.disputes} title="No disputes found" subtitle="Disputes will appear here when they are received." />
            )}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: CHARGEBACK ALERTS
   ======================================================================== */
function ChargebackAlertsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Home');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/alerts').then(r => {
      setAlerts(r.data.alerts || r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const networkCards = [
    { name: 'RDR', fullName: 'Rapid Dispute Resolution', active: true, provider: 'Visa', color: '#1a1f71' },
    { name: 'ETHOCA', fullName: 'Ethoca Alerts', active: true, provider: 'Mastercard', color: '#ff5f00' },
    { name: 'CDRN', fullName: 'Cardholder Dispute Resolution Network', active: false, provider: 'Verifi', color: '#003087' },
  ];

  const subTabs = ['Home', 'All Alerts', 'Settings', 'Credits', 'Insights', 'Coverage', 'Alerts Configuration'];

  const kpis = [
    {
      label: 'Chargebacks Stopped', value: alerts.length || 24, extra: '73%',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      ),
    },
    {
      label: 'Credited Alerts', value: 8, badge: 'Pending',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
    },
    {
      label: 'Refunded Value', value: '$4,250',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Cost', value: '$850',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
  ];

  const breakdownData = [
    { name: 'RDR', value: 45 },
    { name: 'Ethoca', value: 35 },
    { name: 'CDRN', value: 20 },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Chargeback Alerts" subtitle="Monitor and configure your chargeback alert networks" />

      {/* Network Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {networkCards.map(nc => (
          <Card key={nc.name} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{nc.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{nc.fullName}</div>
              </div>
              <Badge variant={nc.active ? 'green' : 'red'}>{nc.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>Provider: {nc.provider}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="secondary" size="sm">
                <span style={{ display: 'flex' }}>{Icons.gear}</span> Configure
              </Button>
              {nc.name === 'ETHOCA' && (
                <button style={{ background: 'none', border: 'none', fontSize: 12, color: COLORS.blue, cursor: 'pointer', fontWeight: 500 }}>See more</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Sub Tabs */}
      <TabBar tabs={subTabs} active={activeSubTab} onChange={setActiveSubTab} style={{ marginBottom: 24 }} />

      {activeSubTab === 'Home' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {kpis.map((kpi, i) => (
              <Card key={i} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{kpi.value}</span>
                      {kpi.extra && <span style={{ fontSize: 13, color: COLORS.green, fontWeight: 600 }}>{kpi.extra}</span>}
                      {kpi.badge && <Badge variant="yellow">{kpi.badge}</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Alert Breakdown */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>Alert Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40 }}>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {breakdownData.map((entry, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                {breakdownData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: CHART_COLORS[idx] }} />
                    <span style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: 500, width: 80 }}>{item.name}</span>
                    <ProgressBar percent={item.value} style={{ flex: 1 }} color={CHART_COLORS[idx]} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, width: 40, textAlign: 'right' }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Alerts Table */}
          <Card style={{ marginTop: 24, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>Recent Alerts</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <SearchInput value="" onChange={() => {}} placeholder="Search alerts..." style={{ width: 200 }} />
                <DateRangePicker />
              </div>
            </div>
            {loading ? <LoadingSpinner /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {['Alert ID', 'Type', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(alerts.length ? alerts.slice(0, 10) : [
                      { id: 'ALT-001', type: 'RDR', amount: 89.99, status: 'resolved', createdAt: '2025-01-15' },
                      { id: 'ALT-002', type: 'Ethoca', amount: 249.00, status: 'pending', createdAt: '2025-01-14' },
                      { id: 'ALT-003', type: 'CDRN', amount: 34.50, status: 'resolved', createdAt: '2025-01-13' },
                    ]).map((a, i) => (
                      <tr key={a.id || i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>{a.id || `ALT-${i + 1}`}</td>
                        <td style={{ padding: '12px 16px' }}><Badge variant={a.type === 'RDR' ? 'blue' : a.type === 'Ethoca' ? 'orange' : 'purple'}>{a.type || 'RDR'}</Badge></td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>${(a.amount || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}><Badge variant={a.status === 'resolved' ? 'green' : 'yellow'}>{a.status || 'pending'}</Badge></td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{a.createdAt || a.date || '--'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button variant="primary" size="sm" onClick={() => api.post(`/api/alerts/${a.id || i}/refund`).catch(() => {})}>Refund</Button>
                            <Button variant="ghost" size="sm" onClick={() => api.post(`/api/alerts/${a.id || i}/ignore`).catch(() => {})}>Ignore</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {activeSubTab !== 'Home' && (
        <Card style={{ padding: 40 }}>
          <EmptyState icon={Icons.alerts} title={activeSubTab} subtitle={`The ${activeSubTab} section is being configured.`} />
        </Card>
      )}
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: MIDs
   ======================================================================== */
function MIDsPage() {
  const [activeTab, setActiveTab] = useState('Dispute Ratios');
  const [search, setSearch] = useState('');
  const [showHiddenMids, setShowHiddenMids] = useState(false);
  const [descriptors, setDescriptors] = useState([]);
  const [expandedMid, setExpandedMid] = useState(null);

  useEffect(() => {
    api.get('/api/merchants/descriptors').then(r => {
      setDescriptors(r.data.descriptors || r.data || []);
    }).catch(() => {});
  }, []);

  const sampleMids = descriptors.length ? descriptors : [
    { id: 'MID-001', name: 'Primary Store', descriptor: 'MYSTORE*ONLINE', alerts: 45, chargebacks: 8, rdr: 20, ethoca: 15, cdrn: 10, ratio: 0.35, crmConnected: true, processorConnected: true, rdrActive: true, ethocaActive: true, cdrnActive: false },
    { id: 'MID-002', name: 'Secondary Store', descriptor: 'MYSTORE*RETAIL', alerts: 22, chargebacks: 4, rdr: 12, ethoca: 7, cdrn: 3, ratio: 0.18, crmConnected: true, processorConnected: false, rdrActive: true, ethocaActive: false, cdrnActive: false },
    { id: 'MID-003', name: 'EU Operations', descriptor: 'MYSTORE*EU', alerts: 15, chargebacks: 2, rdr: 8, ethoca: 5, cdrn: 2, ratio: 0.12, crmConnected: false, processorConnected: false, rdrActive: false, ethocaActive: true, cdrnActive: true },
  ];

  const aggData = {
    alerts: sampleMids.reduce((s, m) => s + (m.alerts || 0), 0),
    chargebacks: sampleMids.reduce((s, m) => s + (m.chargebacks || 0), 0),
    totalRdr: sampleMids.reduce((s, m) => s + (m.rdr || 0), 0),
    totalEthoca: sampleMids.reduce((s, m) => s + (m.ethoca || 0), 0),
    totalCdrn: sampleMids.reduce((s, m) => s + (m.cdrn || 0), 0),
  };

  return (
    <DashboardLayout>
      <PageHeader title="Ratios" subtitle="Monitor your dispute and VAMP ratios across all MIDs" />

      <TabBar tabs={['Dispute Ratios', 'VAMP Ratios']} active={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search MIDs..." style={{ width: 240 }} />
        <DateRangePicker />
        <Button variant="secondary" size="sm" onClick={() => setShowHiddenMids(!showHiddenMids)}>
          {showHiddenMids ? Icons.eyeOff : Icons.eye}
          <span>{showHiddenMids ? 'Hide' : 'Show'} Hidden MIDs</span>
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" size="sm">{Icons.refreshCw} <span>MID Rerouting</span></Button>
        <Button variant="primary" size="sm">{Icons.plus} <span>Add MIDs</span></Button>
      </div>

      {/* Aggregated Data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Alerts', value: aggData.alerts },
          { label: 'Chargebacks', value: aggData.chargebacks },
          { label: 'Total RDR', value: aggData.totalRdr },
          { label: 'Total Ethoca', value: aggData.totalEthoca },
          { label: 'Total CDRN', value: aggData.totalCdrn },
        ].map((ag, i) => (
          <Card key={i} style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{ag.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{ag.value}</div>
          </Card>
        ))}
      </div>

      {/* MID Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sampleMids.filter(m => !search || (m.name || '').toLowerCase().includes(search.toLowerCase()) || (m.descriptor || '').toLowerCase().includes(search.toLowerCase())).map((mid) => (
          <Card key={mid.id} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{mid.name || mid.descriptor}</span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{mid.descriptor}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Ratio: {((mid.ratio || 0) * 100).toFixed(1)}%</div>
              </div>

              {/* Toggle Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>CRM/Gateway</div>
                  <Toggle checked={mid.crmConnected !== false} onChange={() => {}} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>Processor</div>
                  <Toggle checked={mid.processorConnected !== false} onChange={() => {}} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>RDR</div>
                  <Toggle checked={mid.rdrActive !== false} onChange={() => {}} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>Ethoca</div>
                  <Toggle checked={mid.ethocaActive !== false} onChange={() => {}} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 500 }}>CDRN</div>
                  <Toggle checked={mid.cdrnActive !== false} onChange={() => {}} />
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setExpandedMid(expandedMid === mid.id ? null : mid.id)}>
                {expandedMid === mid.id ? 'Hide Graph' : 'Show Graph'}
              </Button>
            </div>

            {expandedMid === mid.id && (
              <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${COLORS.borderLight}` }}>
                <div style={{ height: 200, paddingTop: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: 'Oct', alerts: mid.alerts * 0.6, chargebacks: mid.chargebacks * 0.8 },
                      { month: 'Nov', alerts: mid.alerts * 0.75, chargebacks: mid.chargebacks * 0.7 },
                      { month: 'Dec', alerts: mid.alerts * 0.9, chargebacks: mid.chargebacks * 0.5 },
                      { month: 'Jan', alerts: mid.alerts, chargebacks: mid.chargebacks },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                      <Bar dataKey="alerts" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chargebacks" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: NOTIFICATIONS
   ======================================================================== */
function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, name: 'New Fraud Order Detected', category: 'Fraud', updates: 3, enabled: true },
    { id: 2, name: 'New Fraud Order Refunded', category: 'Fraud', updates: 1, enabled: true },
    { id: 3, name: 'Fraud Review Completed', category: 'Fraud', updates: 0, enabled: false },
    { id: 4, name: 'High Risk Transaction Alert', category: 'Fraud', updates: 5, enabled: true },
    { id: 5, name: 'New Chargeback Received', category: 'Chargeback', updates: 2, enabled: true },
    { id: 6, name: 'Chargeback Response Due', category: 'Chargeback', updates: 0, enabled: true },
    { id: 7, name: 'Chargeback Won', category: 'Chargeback', updates: 1, enabled: false },
    { id: 8, name: 'Chargeback Lost', category: 'Chargeback', updates: 0, enabled: true },
    { id: 9, name: 'Dispute Ratio Warning', category: 'Chargeback', updates: 4, enabled: true },
    { id: 10, name: 'Alert Credit Received', category: 'Chargeback', updates: 0, enabled: false },
  ]);

  const toggleNotif = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const categories = ['Fraud', 'Chargeback'];

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" subtitle="Manage how and when you receive notifications" />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>Your Notifications</h3>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>
              Configure which notifications you receive and how they are delivered.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>To:</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>{user?.email || 'user@example.com'}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, display: 'flex', padding: 4 }}>{Icons.edit}</button>
          </div>
        </div>
      </Card>

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px', padding: '0 4px' }}>{cat}</h3>
          <Card style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Notification Name', 'Updates', 'On/Off', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notifications.filter(n => n.category === cat).map((n) => (
                  <tr key={n.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 14, color: COLORS.textPrimary, fontWeight: 500 }}>{n.name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      {n.updates > 0 ? <Badge variant="blue">{n.updates}</Badge> : <span style={{ fontSize: 13, color: COLORS.textMuted }}>0</span>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Toggle checked={n.enabled} onChange={() => toggleNotif(n.id)} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Button variant="ghost" size="sm">{Icons.edit} <span>Edit</span></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ))}
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: SETTINGS - PROFILE
   ======================================================================== */
function SettingsProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', company: user?.company || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/auth/profile', form);
      updateUser(res.data.user || res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Handle error silently
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your personal information and preferences" />

      <div style={{ maxWidth: 600 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>Personal Information</h3>
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email Address', key: 'email', type: 'email' },
            { label: 'Company Name', key: 'company', type: 'text' },
            { label: 'Phone Number', key: 'phone', type: 'tel' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 6 }}>{field.label}</label>
              <input
                type={field.type} value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
                  borderRadius: COLORS.radiusSm, outline: 'none', color: COLORS.textPrimary, boxSizing: 'border-box',
                  background: COLORS.white,
                }}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            {saved && <span style={{ fontSize: 13, color: COLORS.green, fontWeight: 500 }}>Changes saved successfully</span>}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: SETTINGS - CONNECTED PROCESSORS
   ======================================================================== */
function SettingsProcessorsPage() {
  const [processors, setProcessors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/merchants/processors').then(r => {
      setProcessors(r.data.processors || r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const processorOptions = [
    { name: 'Stripe', color: '#635bff', connected: processors.some(p => p.name === 'Stripe' || p.type === 'stripe') },
    { name: 'Square', color: '#006aff', connected: processors.some(p => p.name === 'Square' || p.type === 'square') },
    { name: 'PayPal', color: '#003087', connected: processors.some(p => p.name === 'PayPal' || p.type === 'paypal') },
    { name: 'Shopify', color: '#7ab55c', connected: false },
    { name: 'Braintree', color: '#000000', connected: false },
  ];

  const handleConnect = async (processorName) => {
    try {
      await api.post('/api/merchants/connect-processor', { processor: processorName.toLowerCase() });
      setProcessors(prev => [...prev, { name: processorName, type: processorName.toLowerCase(), connected: true }]);
    } catch (err) {
      // Handle error
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Connected Processors" subtitle="Connect your payment processors to import transactions and chargebacks" />

      {loading ? <LoadingSpinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {processorOptions.map(proc => (
            <Card key={proc.name} style={{ padding: 24 }} hoverable>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: proc.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: proc.color,
                }}>
                  {proc.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>{proc.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>Payment Processor</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={proc.connected ? 'green' : 'gray'}>{proc.connected ? 'Connected' : 'Not Connected'}</Badge>
                <Button
                  variant={proc.connected ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => !proc.connected && handleConnect(proc.name)}
                >
                  {proc.connected ? 'Configure' : 'Connect'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: SETTINGS - ONBOARDING
   ======================================================================== */
function SettingsOnboardingPage() {
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    api.get('/api/merchants/onboarding-status').then(r => setOnboarding(r.data)).catch(() => {});
  }, []);

  const steps = [
    { key: 'alerts', label: 'Setup Chargeback Alerts', description: 'Configure RDR, Ethoca, and CDRN networks.' },
    { key: 'gateway', label: 'Connect Gateway or CRM', description: 'Link your payment gateway or CRM platform.' },
    { key: 'processor', label: 'Connect Processor', description: 'Import chargebacks from your payment processor.' },
    { key: 'fraud', label: 'Enable AI Fraud Prevention', description: 'Activate machine learning fraud detection.' },
    { key: 'knowledge', label: 'Review Knowledge Base', description: 'Learn about chargeback management best practices.' },
  ];

  const completedSteps = onboarding?.completedSteps || 2;
  const percent = (completedSteps / steps.length) * 100;

  return (
    <DashboardLayout>
      <PageHeader title="Onboarding Progress" subtitle="Complete these steps to get the most out of NoLimitsDisputes" />

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{completedSteps} of {steps.length} steps completed</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.green }}>{Math.round(percent)}%</span>
        </div>
        <ProgressBar percent={percent} height={10} />
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, i) => {
          const done = i < completedSteps;
          return (
            <Card key={step.key} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: done ? COLORS.green : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {done
                    ? <span style={{ color: '#fff', display: 'flex' }}>{Icons.check}</span>
                    : <span style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: 600 }}>{i + 1}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: done ? COLORS.textMuted : COLORS.textPrimary, textDecoration: done ? 'line-through' : 'none' }}>{step.label}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{step.description}</div>
                </div>
                {!done && <Button size="sm">Complete Step</Button>}
                {done && <Badge variant="green">Completed</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}


/* ========================================================================
   PAGE: LOGIN
   ======================================================================== */
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, #f5f6fa 0%, #e8f5e9 100%)`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 20 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff' }}>{Icons.shield}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>NoLimitsDisputes</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>Chargeback Prevention Platform</p>
        </div>

        <Card style={{ padding: 32 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>Welcome back</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: COLORS.textSecondary }}>Sign in to your account</p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: COLORS.radiusSm, background: COLORS.redLight, color: COLORS.red, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
                  borderRadius: COLORS.radiusSm, outline: 'none', color: COLORS.textPrimary, boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
                  borderRadius: COLORS.radiusSm, outline: 'none', color: COLORS.textPrimary, boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600,
                background: COLORS.green, color: '#fff', border: 'none', borderRadius: COLORS.radiusSm,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: COLORS.green, fontWeight: 500, textDecoration: 'none' }}>Sign up</Link>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}


/* ========================================================================
   PAGE: SIGNUP
   ======================================================================== */
function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, #f5f6fa 0%, #e8f5e9 100%)`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff' }}>{Icons.shield}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>NoLimitsDisputes</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>Chargeback Prevention Platform</p>
        </div>

        <Card style={{ padding: 32 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>Create account</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: COLORS.textSecondary }}>Start protecting your revenue today</p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: COLORS.radiusSm, background: COLORS.redLight, color: COLORS.red, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Smith' },
              { label: 'Company', key: 'company', type: 'text', placeholder: 'Your Company Inc.' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@company.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Create a strong password' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 6 }}>{field.label}</label>
                <input
                  type={field.type} value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
                    borderRadius: COLORS.radiusSm, outline: 'none', color: COLORS.textPrimary, boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.green}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600, marginTop: 4,
                background: COLORS.green, color: '#fff', border: 'none', borderRadius: COLORS.radiusSm,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: COLORS.green, fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}


/* ========================================================================
   APP ROOT
   ======================================================================== */
function App() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${COLORS.pageBg}; color: ${COLORS.textPrimary}; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        @keyframes nld-spin { to { transform: rotate(360deg); } }
        @keyframes nld-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute><AdminClientsPage /></ProtectedRoute>} />
            <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><ChargebackAlertsPage /></ProtectedRoute>} />
            <Route path="/mids" element={<ProtectedRoute><MIDsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings/profile" element={<ProtectedRoute><SettingsProfilePage /></ProtectedRoute>} />
            <Route path="/settings/processors" element={<ProtectedRoute><SettingsProcessorsPage /></ProtectedRoute>} />
            <Route path="/settings/onboarding" element={<ProtectedRoute><SettingsOnboardingPage /></ProtectedRoute>} />
            <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2,
  ArrowRight, Shield, Layers, BarChart3, ChevronRight
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@docsphere.com',
    password: 'password123',
    description: 'Full governance access',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.15)',
    border: 'rgba(124,58,237,0.35)',
  },
  {
    role: 'Manager',
    email: 'manager@docsphere.com',
    password: 'password123',
    description: 'Document lifecycle control',
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.15)',
    border: 'rgba(14,165,233,0.35)',
  },
  {
    role: 'Viewer',
    email: 'viewer@docsphere.com',
    password: 'password123',
    description: 'Read-only stakeholder',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.35)',
  },
];

const FEATURES = [
  { icon: Layers, label: 'Version Control', desc: 'Full revision history & audit trail' },
  { icon: Shield, label: 'Access Governance', desc: 'Role-based permissions & approvals' },
  { icon: BarChart3, label: 'Analytics', desc: 'Document lifecycle insights' },
];

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [filledAccount, setFilledAccount] = useState(null);

  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', role: 'VIEWER',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
    setFilledAccount(null);
  };

  const handleQuickFill = (account) => {
    setIsRegister(false);
    setFormData(f => ({ ...f, email: account.email, password: account.password }));
    setErrorMessage('');
    setFilledAccount(account.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (isRegister) {
      if (!formData.first_name || !formData.last_name) {
        setErrorMessage('First and last name are required.');
        setLoading(false);
        return;
      }
      const res = await register(formData);
      if (!res.success) setErrorMessage(res.message);
      else setSuccessMessage('Account created. Signing you in…');
    } else {
      const res = await login(formData.email, formData.password);
      if (!res.success) setErrorMessage(res.message || 'Invalid email or password.');
    }
    setLoading(false);
  };

  const inputStyle = (field) => ({
    background: '#FFFFFF',
    border: `1.5px solid ${focusedField === field ? '#6366F1' : '#E2E8F0'}`,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
    color: '#1a1a1a',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "system-ui, 'Segoe UI', sans-serif",
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "system-ui, 'Segoe UI', -apple-system, sans-serif" }}>



      {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid bg */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'radial-gradient(circle, #6366F1 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400 }}>

          {/* Tab switch */}
          <div style={{ display: 'flex', padding: 4, borderRadius: 14, background: '#EBEBEB', marginBottom: 32 }}>
            {[
              { key: false, label: 'Sign In' },
              { key: true, label: 'Register' },
            ].map(({ key, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setIsRegister(key); setErrorMessage(''); setSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: "system-ui, 'Segoe UI', sans-serif",
                  ...(isRegister === key
                    ? { background: '#fff', color: '#1a1a1a', boxShadow: '0 1px 5px rgba(0,0,0,0.13)' }
                    : { background: 'transparent', color: '#9CA3AF' }),
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: 14, color: '#8F9CAE', margin: '6px 0 0' }}>
              {isRegister
                ? "Join your organization's document workspace."
                : 'Sign in to access your document workspace.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }} className="animate-fadeIn">
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }} className="animate-fadeIn">
              <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { name: 'first_name', label: 'First Name', placeholder: 'Eleanor' },
                  { name: 'last_name', label: 'Last Name', placeholder: 'Vance' },
                ].map(field => (
                  <div key={field.name}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{field.label}</label>
                    <input
                      style={inputStyle(field.name)}
                      type="text"
                      name={field.name}
                      required
                      value={formData[field.name]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ width: 16, height: 16, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: focusedField === 'email' ? '#6366F1' : '#9CA3AF', transition: 'color 0.15s' }} />
                <input
                  style={{ ...inputStyle('email'), paddingLeft: 42 }}
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ width: 16, height: 16, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: focusedField === 'password' ? '#6366F1' : '#9CA3AF', transition: 'color 0.15s' }} />
                <input
                  style={{ ...inputStyle('password'), paddingLeft: 42, paddingRight: 44 }}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Account Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'VIEWER', label: 'Viewer', color: '#10B981' },
                    { value: 'MANAGER', label: 'Manager', color: '#0EA5E9' },
                    { value: 'ADMIN', label: 'Admin', color: '#7C3AED' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, role: r.value }))}
                      style={{
                        padding: '9px 0',
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: "system-ui, 'Segoe UI', sans-serif",
                        ...(formData.role === r.value
                          ? { background: `${r.color}18`, border: `1.5px solid ${r.color}55`, color: r.color }
                          : { background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#6B7280' }),
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 12,
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'box-shadow 0.2s, opacity 0.2s',
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.42)',
                marginTop: 4,
                fontFamily: "system-ui, 'Segoe UI', sans-serif",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 22px rgba(99,102,241,0.58)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.42)'; }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 32 }}>
            Protected by enterprise-grade encryption.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/employees');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ─── LEFT BRAND PANEL ─── */}
      <div style={{
        background: 'linear-gradient(145deg, #0F0A2E 0%, #1E1B4B 40%, #312E81 75%, #4338CA 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)', top: -140, right: -120 }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)', bottom: -100, left: -80 }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 48, height: 48, background: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: -0.5 }}>
            Payroll<span style={{ color: '#A5B4FC' }}>Hub</span>
          </span>
        </div>

        {/* Hero */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 500, color: '#A5B4FC', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, background: '#6EE7B7', borderRadius: '50%', display: 'inline-block' }} />
            Enterprise Salary Intelligence
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 18 }}>
            Manage your <em style={{ fontStyle: 'normal', color: '#A5B4FC' }}>workforce</em> with confidence
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
            A unified platform for salary management, employee analytics, and real-time organizational insights — built for scale.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 44 }}>
            {[
              { value: '10K+', label: 'Employees' },
              { value: '150+', label: 'Organisations' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 16px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'white', letterSpacing: -0.5 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 PayrollHub Inc. · Enterprise Salary Intelligence Platform</p>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 56px', background: '#F8FAFC' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: -0.5 }}>Welcome back</h1>
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Sign in to your organization workspace to access the dashboard</p>
          </div>

          {error && (
            <div className="error-banner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>Work email address</div>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  style={{ width: '100%', height: 46, padding: '0 44px', border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`, borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0F172A', background: 'white', outline: 'none' }}
                  type="email" placeholder="you@yourcompany.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  onFocus={(e) => { e.target.style.borderColor = '#4F46E5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>Password</div>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  style={{ width: '100%', height: 46, padding: '0 44px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0F172A', background: 'white', outline: 'none' }}
                  type={showPwd ? 'text' : 'password'} placeholder="Enter your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                  onFocus={(e) => { e.target.style.borderColor = '#4F46E5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', background: 'none', border: 'none', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
                  {showPwd ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 46, background: loading ? '#818CF8' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.01em', marginTop: 8, transition: 'all 0.2s' }}
            >
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </form>

          {/* Security badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>secured</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {['JWT Auth', 'bcrypt', 'Multi-tenant'].map((badge) => (
              <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

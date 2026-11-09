'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Lock, User } from 'lucide-react';

// Inline SVG of PayYantra logo mark (circuit-style PY)
const PayYantraLogo = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="20" fill="url(#grad)" />
    {/* P letter circuit */}
    <rect x="22" y="28" width="4" height="64" rx="2" fill="white" opacity="0.9" />
    <path
      d="M26 28 H46 Q62 28 62 44 Q62 60 46 60 H26"
      stroke="white"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="26" cy="28" r="3" fill="white" />
    <circle cx="52" cy="34" r="2.5" fill="white" opacity="0.7" />
    <circle cx="58" cy="44" r="2.5" fill="white" opacity="0.7" />
    <circle cx="52" cy="54" r="2.5" fill="white" opacity="0.7" />
    <circle cx="26" cy="60" r="3" fill="white" />
    <circle cx="26" cy="92" r="3" fill="white" />
    {/* Y letter circuit */}
    <path
      d="M72 28 L86 52 L100 28"
      stroke="white"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M86 52 L86 92" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="72" cy="28" r="3" fill="white" />
    <circle cx="100" cy="28" r="3" fill="white" />
    <circle cx="86" cy="52" r="3.5" fill="white" />
    <circle cx="86" cy="92" r="3" fill="white" />
    <circle cx="79" cy="40" r="2" fill="white" opacity="0.6" />
    <circle cx="93" cy="40" r="2" fill="white" opacity="0.6" />
    <circle cx="86" cy="72" r="2" fill="white" opacity="0.6" />
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="120" y2="120">
        <stop offset="0%" stopColor="#0B2A5B" />
        <stop offset="100%" stopColor="#1E88E5" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      router.push('/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0B2A5B 0%, #1565C0 50%, #1E88E5 100%)',
      }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          color: 'white',
        }}
      >
        <PayYantraLogo size={80} />
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em' }}>
            <span style={{ color: 'white' }}>Pay</span>
            <span style={{ color: '#4FA3F7' }}>Yantra</span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.65)',
              marginTop: 8,
              maxWidth: 280,
              lineHeight: 1.7,
            }}
          >
            Fraud Risk Management Platform for Payment Orchestration
          </div>
        </div>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { label: 'Real-time Screening', desc: 'Sub-50ms transaction scoring' },
            { label: '18 Fraud Rules', desc: 'Static, aggregation & blacklist' },
            { label: 'Case Management', desc: 'Full audit trail & workflow' },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#4FA3F7',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          width: 420,
          background: '#F5F7FA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          margin: '0 auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <PayYantraLogo size={52} />
            <div
              style={{
                marginTop: 14,
                fontSize: 22,
                fontWeight: 700,
                color: '#0B2A5B',
                letterSpacing: '-0.02em',
              }}
            >
              Pay<span style={{ color: '#1E88E5' }}>Yantra</span>
            </div>
            <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>FRM Dashboard</div>
          </div>

          {/* Card */}
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 8px 32px rgba(11,42,91,0.12)',
              border: '1px solid #DDE3EF',
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0B2A5B', marginBottom: 6 }}>
              Sign in
            </h2>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 24 }}>
              Enter your credentials to access the dashboard
            </p>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 20,
                  color: '#DC2626',
                  fontSize: 12,
                }}
              >
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6,
                  }}
                >
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="text"
                    value={form.username}
                    required
                    autoFocus
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="admin"
                    style={{ width: '100%', paddingLeft: 34 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6,
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="password"
                    value={form.password}
                    required
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{ width: '100%', paddingLeft: 34 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  border: 'none',
                  background: loading
                    ? '#93C5FD'
                    : 'linear-gradient(135deg, #0B2A5B, #1E88E5)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font)',
                  letterSpacing: '0.01em',
                  boxShadow: '0 4px 12px rgba(30,136,229,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 24 }}>
            PayYantra Payment Orchestration · FRM v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

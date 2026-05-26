import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handle = e => { clearError(); setForm(p => ({ ...p, [e.target.name]: e.target.value })); };
  const submit = async e => {
    e.preventDefault();
    const r = await login(form.email, form.password);
    if (r.success) navigate('/map');
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--c-bg)' }}>

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(34,211,160,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="relative w-full max-w-[360px] anim-fadeup">

        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--c-accent)', boxShadow: '0 0 24px rgba(34,211,160,0.4)' }}>
            <Compass size={20} color="#040a06" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display font-bold text-base leading-none" style={{ color: 'var(--c-text)' }}>TrailTracker</p>
            <p className="font-mono text-[9px] tracking-widest uppercase mt-0.5" style={{ color: 'var(--c-accent)' }}>Pro</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>
          Welcome back
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--c-muted)' }}>Sign in to your account</p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm anim-scalein"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--c-muted)' }}>
              Email
            </label>
            <input name="email" type="email" required autoComplete="email"
              value={form.email} onChange={handle}
              placeholder="you@example.com"
              className="input" />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--c-muted)' }}>
              Password
            </label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} required
                value={form.password} onChange={handle}
                placeholder="••••••••"
                className="input pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--c-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="btn btn-primary w-full justify-center mt-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
            {isLoading ? 'Signing in…' : <>Sign In <ArrowRight size={15} /></>}
          </button>
        </form>

        <button onClick={() => { clearError(); setForm({ email: 'demo@trailtracker.pro', password: 'demo1234' }); }}
          className="w-full mt-3 py-2.5 rounded-lg text-xs font-mono transition-all text-center"
          style={{ background: 'var(--c-faint)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
          Fill demo credentials
        </button>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--c-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--c-accent)' }} className="font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

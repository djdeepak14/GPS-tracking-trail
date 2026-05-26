import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const FIELDS = [
  { name: 'username', label: 'Username',  type: 'text',     placeholder: 'trailblazer' },
  { name: 'email',    label: 'Email',     type: 'email',    placeholder: 'you@example.com' },
  { name: 'password', label: 'Password',  type: 'password', placeholder: 'Min. 6 characters' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handle = e => { clearError(); setForm(p => ({ ...p, [e.target.name]: e.target.value })); };
  const submit = async e => {
    e.preventDefault();
    const r = await register(form.username, form.email, form.password);
    if (r.success) navigate('/map');
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--c-bg)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(34,211,160,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="relative w-full max-w-[360px] anim-fadeup">
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

        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>Create account</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--c-muted)' }}>Start tracking your adventures</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm anim-scalein"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {FIELDS.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--c-muted)' }}>
                {label}
              </label>
              <input name={name} type={type} required
                value={form[name]} onChange={handle} placeholder={placeholder}
                className="input" />
            </div>
          ))}

          <button type="submit" disabled={isLoading}
            className="btn btn-primary w-full justify-center mt-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
            {isLoading ? 'Creating…' : <>Create Account <ArrowRight size={15} /></>}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--c-muted)' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: 'var(--c-accent)' }} className="font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

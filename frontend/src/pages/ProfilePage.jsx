import React, { useState } from 'react';
import { User, Sliders, Shield, CheckCircle, AlertCircle, Save, Compass } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { formatDistance, formatDuration } from '../utils/formatters';

const Section = ({ title, icon: Icon, color, children }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 mb-5 pb-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="font-display font-bold text-sm" style={{ color: 'var(--c-text)' }}>{title}</p>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>{label}</label>
    {children}
  </div>
);

const Toggle = ({ on, toggle }) => (
  <div onClick={toggle} className={`toggle cursor-pointer ${on ? 'toggle-on' : 'toggle-off'}`}>
    <div className="toggle-thumb" />
  </div>
);

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [prefForm,    setPrefForm]    = useState({
    units:              user?.preferences?.units              || 'metric',
    theme:              user?.preferences?.theme              || 'dark',
    defaultTrailColor:  user?.preferences?.defaultTrailColor  || '#22d3a0',
    autoCenter:         user?.preferences?.autoCenter          ?? true,
    trackingInterval:   user?.preferences?.trackingInterval   || 5000,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(null);
  const [toast,  setToast]  = useState(null);

  const notify = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving('profile');
    try { const r = await api.put('/auth/profile', profileForm); updateUser(r.data.user); notify('Profile updated'); }
    catch (err) { notify(err.response?.data?.message || 'Error', true); }
    finally { setSaving(null); }
  };

  const savePrefs = async (e) => {
    e.preventDefault(); setSaving('prefs');
    try { const r = await api.put('/auth/profile', { preferences: prefForm }); updateUser(r.data.user); notify('Preferences saved'); }
    catch (err) { notify(err.response?.data?.message || 'Error', true); }
    finally { setSaving(null); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { notify('Passwords do not match', true); return; }
    if (pwForm.newPassword.length < 6) { notify('Min. 6 characters', true); return; }
    setSaving('pw');
    try { await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' }); notify('Password changed'); }
    catch (err) { notify(err.response?.data?.message || 'Error', true); }
    finally { setSaving(null); }
  };

  const s = user?.stats || {};

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: 'var(--c-bg)' }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl notif border text-sm`}
          style={toast.err
            ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }
            : { background: 'rgba(34,211,160,0.15)', borderColor: 'rgba(34,211,160,0.3)', color: '#22d3a0' }}>
          {toast.err ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--c-text)' }}>Profile & Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: avatar + stats */}
        <div className="space-y-4">
          {/* Avatar */}
          <div className="card p-5 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--c-accent)', boxShadow: '0 0 24px rgba(34,211,160,0.3)' }}>
              <span className="font-display text-2xl font-bold" style={{ color: '#040a06' }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--c-text)' }}>{user?.username}</p>
            <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{user?.email}</p>
            {user?.bio && <p className="text-xs mt-2 italic" style={{ color: 'var(--c-muted)' }}>"{user.bio}"</p>}
          </div>

          {/* Stats */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Compass size={14} style={{ color: 'var(--c-accent)' }} />
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Lifetime</p>
            </div>
            <div className="space-y-2">
              {[
                ['Routes',    s.totalRoutes || 0],
                ['Distance',  formatDistance(s.totalDistance)],
                ['Time',      formatDuration(s.totalTime, true)],
                ['Stops',     s.totalStops || 0],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{l}</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: forms */}
        <div className="xl:col-span-2 space-y-4">

          {/* Profile */}
          <Section title="Profile" icon={User} color="#60a5fa">
            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Username">
                <input value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} className="input text-sm" />
              </Field>
              <Field label="Bio">
                <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  rows={2} maxLength={200} placeholder="Tell us about yourself…"
                  className="input text-sm resize-none" />
                <p className="text-right font-mono text-[10px] mt-1" style={{ color: 'var(--c-muted)' }}>{profileForm.bio.length}/200</p>
              </Field>
              <button type="submit" disabled={saving==='profile'} className="btn btn-primary text-xs">
                <Save size={13} /> {saving==='profile' ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </Section>

          {/* Preferences */}
          <Section title="Preferences" icon={Sliders} color="#c084fc">
            <form onSubmit={savePrefs} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Units">
                  <select value={prefForm.units} onChange={e => setPrefForm(p => ({ ...p, units: e.target.value }))} className="select w-full text-sm">
                    <option value="metric">Metric (km)</option>
                    <option value="imperial">Imperial (mi)</option>
                  </select>
                </Field>
                <Field label="GPS Interval">
                  <select value={prefForm.trackingInterval} onChange={e => setPrefForm(p => ({ ...p, trackingInterval: +e.target.value }))} className="select w-full text-sm">
                    <option value={2000}>2s — High</option>
                    <option value={5000}>5s — Balanced</option>
                    <option value={10000}>10s — Battery</option>
                  </select>
                </Field>
              </div>

              <Field label="Trail Color">
                <div className="flex items-center gap-3">
                  <input type="color" value={prefForm.defaultTrailColor}
                    onChange={e => setPrefForm(p => ({ ...p, defaultTrailColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${prefForm.defaultTrailColor}, ${prefForm.defaultTrailColor}44)` }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--c-muted)' }}>{prefForm.defaultTrailColor}</span>
                </div>
              </Field>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-display font-medium" style={{ color: 'var(--c-text)' }}>Auto-center map</p>
                  <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Follow GPS position on map</p>
                </div>
                <Toggle on={prefForm.autoCenter} toggle={() => setPrefForm(p => ({ ...p, autoCenter: !p.autoCenter }))} />
              </div>

              <button type="submit" disabled={saving==='prefs'} className="btn text-xs"
                style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}>
                <Save size={13} /> {saving==='prefs' ? 'Saving…' : 'Save Preferences'}
              </button>
            </form>
          </Section>

          {/* Password */}
          <Section title="Security" icon={Shield} color="#f59e0b">
            <form onSubmit={changePw} className="space-y-3">
              {[
                ['currentPassword','Current Password'],
                ['newPassword','New Password'],
                ['confirmPassword','Confirm Password'],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input type="password" value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                    placeholder="••••••••" className="input text-sm" />
                </Field>
              ))}
              <button type="submit" disabled={saving==='pw'} className="btn text-xs mt-1"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Shield size={13} /> {saving==='pw' ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}

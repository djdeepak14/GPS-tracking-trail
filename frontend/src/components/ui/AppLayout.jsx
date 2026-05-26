import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Map, LayoutDashboard, History, BarChart2,
  User, LogOut, PanelLeftClose, PanelLeftOpen,
  Compass, Radio
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTrackingStore } from '../../store/trackingStore';

const NAV = [
  { to: '/map',       icon: Map,             label: 'Live Map',   badge: null },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  badge: null },
  { to: '/history',   icon: History,         label: 'Routes',     badge: null },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics',  badge: null },
  { to: '/profile',   icon: User,            label: 'Profile',    badge: null },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { isTracking, stats } = useTrackingStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>

      {/* ── Sidebar ── */}
      <aside className={`
        relative flex flex-col shrink-0 overflow-hidden
        border-r transition-all duration-300 ease-out
        ${collapsed ? 'w-[58px]' : 'w-[210px]'}
      `} style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>

        {/* Top: logo + collapse */}
        <div className="flex items-center gap-3 px-3 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--c-accent)', boxShadow: '0 0 16px rgba(34,211,160,0.35)' }}>
            <Compass size={15} color="#040a06" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="font-display font-800 text-sm leading-tight" style={{ color: 'var(--c-text)', fontWeight: 700 }}>TrailTracker</p>
              <p className="font-mono text-[9px] tracking-[0.15em] uppercase" style={{ color: 'var(--c-accent)' }}>Pro</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 ml-auto p-1 rounded transition-colors"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Tracking live indicator */}
        {isTracking && (
          <div className="mx-2 mt-2 px-2 py-2 rounded-lg border" style={{
            background: 'rgba(34,211,160,0.07)',
            borderColor: 'rgba(34,211,160,0.2)'
          }}>
            <div className="flex items-center gap-2">
              <span className="relative flex-shrink-0">
                <Radio size={12} style={{ color: 'var(--c-accent)' }} />
              </span>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'var(--c-accent)' }}>Live tracking</p>
                  <p className="font-mono text-[10px] font-medium" style={{ color: 'var(--c-text)' }}>
                    {stats?.totalDistance ? `${(stats.totalDistance/1000).toFixed(2)}km` : '0.00km'}
                  </p>
                </div>
              )}
              {!collapsed && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto mt-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="p-2 border-t" style={{ borderColor: 'var(--c-border)' }}>
          {!collapsed && user && (
            <div className="px-3 py-2 mb-1 rounded-lg" style={{ background: 'var(--c-faint)' }}>
              <p className="font-display text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{user.username}</p>
              <p className="font-mono text-[10px] truncate" style={{ color: 'var(--c-muted)' }}>{user.email}</p>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="nav-item w-full"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = ''; }}
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}

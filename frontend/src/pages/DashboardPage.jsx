import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Target, MapPin, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend
} from 'chart.js';
import { formatDistance, formatDuration, formatDate, getRouteTypeIcon } from '../utils/formatters';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const chartOpts = (color) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(13,17,23,0.95)',
      borderColor: '#243044',
      borderWidth: 1,
      titleColor: '#e8edf5',
      bodyColor: '#64748b',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(28,37,53,0.8)', drawBorder: false }, ticks: { color: '#374151', font: { size: 10, family: 'IBM Plex Mono' } } },
    y: { grid: { color: 'rgba(28,37,53,0.8)', drawBorder: false }, ticks: { color: '#374151', font: { size: 10, family: 'IBM Plex Mono' } }, beginAtZero: true },
  },
});

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/daily?days=14'),
      api.get('/routes?status=completed&limit=5'),
    ]).then(([o, d, r]) => {
      setOverview(o.data.data);
      setDaily(d.data.data || []);
      setRecent(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const ls = overview?.lifetime || {};
  const labels = daily.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
  const distKm  = daily.map(d => +(d.totalDistance / 1000).toFixed(2));
  const routeC  = daily.map(d => d.routeCount);

  const cards = [
    { label: 'Total Distance', val: formatDistance(ls.totalDistance), icon: TrendingUp, color: '#22d3a0', sub: `${overview?.totalRoutes || 0} routes total` },
    { label: 'Active Time',    val: formatDuration(ls.totalTime, true), icon: Clock,    color: '#60a5fa', sub: 'Lifetime moving time' },
    { label: 'Routes',         val: overview?.totalRoutes || 0,          icon: Target,   color: '#f59e0b', sub: 'Completed sessions' },
    { label: 'Stops',          val: ls.totalStops || 0,                  icon: MapPin,   color: '#c084fc', sub: 'Places visited' },
  ];

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: 'var(--c-bg)' }}>

      {/* Header */}
      <div className="mb-6 anim-fadeup">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: 'var(--c-text)' }}>
              Hey, <span className="text-gradient">{user?.username}</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>Here's your trail summary</p>
          </div>
          {overview?.activeRoute && (
            <Link to="/map" className="badge badge-green gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live session
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {cards.map(({ label, val, icon: Icon, color, sub }, i) => (
          <div key={label} className="card card-hover p-4 anim-fadeup" style={{ animationDelay: `${i*60}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--c-border2)' }} />
            </div>
            <div className="stat-value text-xl mb-1">{val}</div>
            <div className="font-display text-xs font-semibold mb-0.5" style={{ color: 'var(--c-text)' }}>{label}</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--c-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Distance / day</p>
            <span className="badge badge-green">14d</span>
          </div>
          <div style={{ height: 160 }}>
            <Line data={{
              labels,
              datasets: [{
                data: distKm,
                borderColor: '#22d3a0',
                backgroundColor: 'rgba(34,211,160,0.06)',
                fill: true, tension: 0.4,
                pointRadius: 3, pointBackgroundColor: '#22d3a0',
                borderWidth: 2,
              }],
            }} options={chartOpts('#22d3a0')} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Routes / day</p>
            <span className="badge badge-blue">14d</span>
          </div>
          <div style={{ height: 160 }}>
            <Bar data={{
              labels,
              datasets: [{
                data: routeC,
                backgroundColor: 'rgba(59,130,246,0.55)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 5,
              }],
            }} options={chartOpts('#3b82f6')} />
          </div>
        </div>
      </div>

      {/* Recent Routes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Recent Routes</p>
          <Link to="/history" className="flex items-center gap-1 text-xs font-mono transition-colors"
            style={{ color: 'var(--c-accent)' }}>
            View all <ChevronRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10">
            <TrendingUp size={28} style={{ color: 'var(--c-border2)' }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: 'var(--c-muted)' }}>No routes yet — start tracking!</p>
            <Link to="/map" className="inline-flex mt-3 btn btn-primary text-xs">Open Map</Link>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map(route => (
              <div key={route._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{ cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-faint)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="text-lg flex-shrink-0">{getRouteTypeIcon(route.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{route.name}</p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--c-muted)' }}>{formatDate(route.startTime)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs font-semibold" style={{ color: 'var(--c-text)' }}>
                    {formatDistance(route.stats?.totalDistance)}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--c-muted)' }}>
                    {formatDuration(route.stats?.totalDuration, true)}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: route.color || '#22d3a0' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-full overflow-y-auto p-5 space-y-5" style={{ background: 'var(--c-bg)' }}>
      <div className="skeleton h-8 w-52 rounded-xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[...Array(2)].map((_,i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, MapPin, Activity } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { formatDistance, formatDuration, formatDateTime } from '../utils/formatters';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const base = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(13,17,23,0.95)', borderColor: '#243044', borderWidth: 1,
      titleColor: '#e8edf5', bodyColor: '#64748b', padding: 10, cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(28,37,53,0.8)', drawBorder: false }, ticks: { color: '#374151', font: { size: 10, family: 'IBM Plex Mono' } } },
    y: { grid: { color: 'rgba(28,37,53,0.8)', drawBorder: false }, ticks: { color: '#374151', font: { size: 10, family: 'IBM Plex Mono' } }, beginAtZero: true },
  },
};

export default function AnalyticsPage() {
  const [daily,    setDaily]    = useState([]);
  const [stops,    setStops]    = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [days,     setDays]     = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/analytics/daily?days=${days}`),
      api.get('/analytics/stops?limit=8'),
      api.get('/analytics/overview'),
    ]).then(([d, s, o]) => {
      setDaily(d.data.data || []);
      setStops(s.data.data || []);
      setOverview(o.data.data);
    }).finally(() => setLoading(false));
  }, [days]);

  const labels    = daily.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
  const distKm    = daily.map(d => +(d.totalDistance/1000).toFixed(2));
  const routeC    = daily.map(d => d.routeCount);
  const speedKmh  = daily.map(d => +(d.avgSpeed*3.6).toFixed(1));
  const activeDays = daily.filter(d => d.routeCount > 0).length;
  const restDays   = daily.length - activeDays;
  const ls = overview?.lifetime || {};

  const summaryCards = [
    { label: 'Total Distance', val: formatDistance(ls.totalDistance), icon: TrendingUp, color: '#22d3a0' },
    { label: 'Active Time',    val: formatDuration(ls.totalTime, true), icon: Clock,    color: '#60a5fa' },
    { label: 'Places Visited', val: ls.totalStops || 0,                  icon: MapPin,   color: '#f59e0b' },
    { label: 'Active Days',    val: activeDays,                           icon: Activity, color: '#c084fc' },
  ];

  if (loading) return (
    <div className="h-full overflow-y-auto p-5 space-y-5" style={{ background: 'var(--c-bg)' }}>
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-60 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: 'var(--c-bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Trail statistics and insights</p>
        </div>
        <div className="flex gap-1.5">
          {[7,14,30,90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                ${days===d ? 'badge badge-green border-[rgba(34,211,160,0.3)]' : 'btn btn-ghost text-xs'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {summaryCards.map(({ label, val, icon: Icon, color }, i) => (
          <div key={label} className="card card-hover p-4 anim-fadeup" style={{ animationDelay: `${i*50}ms` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="stat-value text-xl mb-1">{val}</div>
            <div className="font-display text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">

        {/* Distance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Distance (km)</p>
            <span className="badge badge-green">{days}d</span>
          </div>
          <div style={{ height: 155 }}>
            {labels.length > 0 ? (
              <Line data={{ labels, datasets: [{
                data: distKm, borderColor: '#22d3a0', backgroundColor: 'rgba(34,211,160,0.06)',
                fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#22d3a0', borderWidth: 2,
              }]}} options={base} />
            ) : <Empty />}
          </div>
        </div>

        {/* Routes/day */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Routes / Day</p>
            <span className="badge badge-blue">{days}d</span>
          </div>
          <div style={{ height: 155 }}>
            {labels.length > 0 ? (
              <Bar data={{ labels, datasets: [{
                data: routeC, backgroundColor: 'rgba(59,130,246,0.55)',
                borderColor: '#3b82f6', borderWidth: 1, borderRadius: 5,
              }]}} options={base} />
            ) : <Empty />}
          </div>
        </div>

        {/* Speed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Avg Speed (km/h)</p>
            <span className="badge badge-amber">{days}d</span>
          </div>
          <div style={{ height: 155 }}>
            {labels.length > 0 ? (
              <Line data={{ labels, datasets: [{
                data: speedKmh, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)',
                fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#f59e0b', borderWidth: 2,
              }]}} options={base} />
            ) : <Empty />}
          </div>
        </div>

        {/* Active/rest doughnut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Active vs Rest</p>
            <span className="badge badge-purple">{days}d</span>
          </div>
          <div className="flex items-center gap-6" style={{ height: 155 }}>
            <div style={{ height: 155, width: 155, flexShrink: 0 }}>
              <Doughnut data={{
                labels: ['Active','Rest'],
                datasets: [{
                  data: [activeDays, Math.max(0,restDays)],
                  backgroundColor: ['rgba(34,211,160,0.8)','rgba(30,41,59,0.8)'],
                  borderColor: ['#22d3a0','#1e293b'], borderWidth: 2,
                }],
              }} options={{
                responsive: true, maintainAspectRatio: false, cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(13,17,23,0.95)', borderColor: '#243044', borderWidth:1 } },
              }} />
            </div>
            <div className="space-y-4">
              {[
                { label: 'Active', val: activeDays, color: '#22d3a0' },
                { label: 'Rest',   val: Math.max(0,restDays), color: '#1e293b' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full border" style={{ background: color, borderColor: color === '#1e293b' ? '#374151' : color }} />
                    <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</span>
                  </div>
                  <p className="stat-value text-xl">{val}<span className="font-mono text-xs ml-1" style={{ color: 'var(--c-muted)' }}>days</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stops timeline */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={15} style={{ color: '#f59e0b' }} />
          <p className="font-display font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Stops Timeline</p>
          <span className="badge badge-amber ml-auto">Last 8</span>
        </div>

        {stops.length === 0 ? (
          <div className="text-center py-10">
            <MapPin size={30} style={{ color: 'var(--c-border2)' }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: 'var(--c-muted)' }}>No stops recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-3 bottom-3 w-px" style={{ background: 'var(--c-border)' }} />
            <div className="space-y-3 pl-8">
              {stops.map((stop, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 top-2.5 w-2 h-2 rounded-full" style={{ background: '#f59e0b', border: '2px solid var(--c-bg)' }} />
                  <div className="rounded-xl p-3 border" style={{ background: 'var(--c-panel)', borderColor: 'var(--c-border)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px]" style={{ color: 'var(--c-accent)' }}>
                          {stop.lat?.toFixed(5)}, {stop.lng?.toFixed(5)}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                          {stop.routeName && <><em style={{ color: 'var(--c-text)', fontStyle:'normal' }}>{stop.routeName}</em> · </>}
                          {formatDateTime(stop.arrivalTime)}
                        </p>
                      </div>
                      <span className="badge badge-amber flex-shrink-0">
                        {formatDuration(stop.duration, true)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Empty = () => (
  <div className="h-full flex items-center justify-center font-mono text-xs" style={{ color: 'var(--c-border2)' }}>
    No data for this period
  </div>
);

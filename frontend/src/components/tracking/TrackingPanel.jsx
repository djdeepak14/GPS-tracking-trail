import React from 'react';
import { Navigation, Clock, Gauge, Mountain, Wind, MapPin, Activity } from 'lucide-react';
import { formatDistance, formatDuration, formatSpeed } from '../../utils/formatters';

export default function TrackingPanel({ stats, currentSpeed, currentAltitude, currentHeading, accuracy, livePoints }) {
  const items = [
    { icon: Navigation, label: 'Dist',    val: formatDistance(stats.totalDistance),     color: '#22d3a0' },
    { icon: Clock,      label: 'Time',    val: formatDuration(stats.totalDuration,true), color: '#60a5fa' },
    { icon: Gauge,      label: 'Speed',   val: formatSpeed(currentSpeed||0),             color: '#f59e0b' },
    { icon: Gauge,      label: 'Avg',     val: formatSpeed(stats.avgSpeed||0),           color: '#f59e0b' },
    { icon: Mountain,   label: 'Alt',     val: currentAltitude ? `${Math.round(currentAltitude)}m` : '—', color: '#c084fc' },
    { icon: Wind,       label: 'Head',    val: currentHeading  ? `${Math.round(currentHeading)}°` : '—',  color: '#34d399' },
    { icon: MapPin,     label: 'Acc',     val: accuracy        ? `±${Math.round(accuracy)}m` : '—',       color: '#fb923c' },
    { icon: Activity,   label: 'Pts',     val: livePoints?.length || 0,                  color: '#94a3b8' },
  ];

  return (
    <div className="absolute left-4 top-4 z-[500] w-44 space-y-1.5">
      {items.slice(0,4).map(({ icon: Icon, label, val, color }) => (
        <div key={label} className="glass rounded-xl px-3 py-2 border" style={{ borderColor:'var(--c-border2)' }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon size={10} style={{ color }}/>
            <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color:'var(--c-muted)' }}>{label}</span>
          </div>
          <p className="font-mono text-xs font-semibold" style={{ color:'var(--c-text)' }}>{val}</p>
        </div>
      ))}
    </div>
  );
}

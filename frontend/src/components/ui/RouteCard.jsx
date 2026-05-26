import React from 'react';
import { Star, Clock, Navigation, Gauge, ChevronRight } from 'lucide-react';
import { formatDistance, formatDuration, formatSpeed, formatDate, getRouteTypeIcon } from '../../utils/formatters';

export default function RouteCard({ route, onClick, isSelected, compact = false }) {
  const s = route.stats || {};
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border"
      style={{
        background: isSelected ? 'rgba(34,211,160,0.05)' : 'var(--c-panel)',
        borderColor: isSelected ? 'rgba(34,211,160,0.22)' : 'var(--c-border)',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-border2)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-border)'; }}>
      <div className="text-xl flex-shrink-0 w-7 text-center">{getRouteTypeIcon(route.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-display text-xs font-semibold truncate" style={{ color:'var(--c-text)' }}>{route.name || 'Unnamed'}</p>
          {route.isFavorite && <Star size={11} style={{ color:'#fbbf24', fill:'#fbbf24' }} className="flex-shrink-0" />}
        </div>
        <p className="font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>{formatDate(route.startTime || route.createdAt)}</p>
        {!compact && (
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>
              <Navigation size={9}/>{formatDistance(s.totalDistance)}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>
              <Clock size={9}/>{formatDuration(s.totalDuration, true)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full" style={{ background: route.color || '#22d3a0' }} />
        <ChevronRight size={13} style={{ color:'var(--c-border2)' }} />
      </div>
    </div>
  );
}

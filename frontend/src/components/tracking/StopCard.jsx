import React from 'react';
import { MapPin, Clock, LogIn, LogOut } from 'lucide-react';
import { formatDuration, formatDateTime } from '../../utils/formatters';

export default function StopCard({ stop, index }) {
  return (
    <div className="relative pl-7">
      <div className="absolute left-0 top-3 w-2.5 h-2.5 rounded-full"
        style={{ background:'#f59e0b', border:'2px solid var(--c-bg)', boxShadow:'0 0 6px rgba(245,158,11,0.4)' }}/>
      <div className="rounded-xl p-3 border transition-all" style={{ background:'var(--c-panel)', borderColor:'var(--c-border)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-border2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color:'#f59e0b' }}/>
            <span className="font-mono text-[10px]" style={{ color:'var(--c-accent)' }}>
              {stop.lat?.toFixed(5)}, {stop.lng?.toFixed(5)}
            </span>
          </div>
          <span className="badge badge-amber flex-shrink-0">{formatDuration(stop.duration, true)}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {stop.arrivalTime && (
            <div className="flex items-center gap-1">
              <LogIn size={9} style={{ color:'#22d3a0' }}/>
              <span className="font-mono text-[9px]" style={{ color:'var(--c-muted)' }}>{formatDateTime(stop.arrivalTime)}</span>
            </div>
          )}
          {stop.departureTime && (
            <div className="flex items-center gap-1">
              <LogOut size={9} style={{ color:'#f87171' }}/>
              <span className="font-mono text-[9px]" style={{ color:'var(--c-muted)' }}>{formatDateTime(stop.departureTime)}</span>
            </div>
          )}
        </div>
        {stop.note && <p className="text-[10px] italic mt-2 pt-2 border-t" style={{ color:'var(--c-muted)', borderColor:'var(--c-border)' }}>"{stop.note}"</p>}
        {stop.routeName && (
          <p className="font-mono text-[9px] mt-1.5" style={{ color:'var(--c-muted)' }}>
            Route: <span style={{ color:'var(--c-text)' }}>{stop.routeName}</span>
          </p>
        )}
      </div>
    </div>
  );
}

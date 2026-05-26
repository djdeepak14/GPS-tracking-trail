import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = '#22d3a0', sub, trend, trendLabel, className = '' }) {
  const bg = `${color}14`;
  const border = `${color}28`;
  return (
    <div className={`card card-hover p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg, border:`1px solid ${border}` }}>
          {Icon && <Icon size={15} style={{ color }} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 font-mono text-[10px]`}
            style={{ color: trend > 0 ? '#22d3a0' : trend < 0 ? '#f87171' : 'var(--c-muted)' }}>
            {trend > 0 ? <TrendingUp size={11}/> : trend < 0 ? <TrendingDown size={11}/> : <Minus size={11}/>}
            {trendLabel || `${Math.abs(trend)}%`}
          </div>
        )}
      </div>
      <div className="stat-value text-xl mb-1">{value ?? '—'}</div>
      <p className="font-display text-xs font-semibold" style={{ color:'var(--c-text)' }}>{label}</p>
      {sub && <p className="font-mono text-[10px] mt-0.5" style={{ color:'var(--c-muted)' }}>{sub}</p>}
    </div>
  );
}

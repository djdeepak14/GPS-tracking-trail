import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Mountain } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function ElevationChart({ points = [] }) {
  const data = useMemo(() => {
    const pts = points.filter(p => p.altitude != null);
    if (pts.length < 2) return null;
    const step = Math.max(1, Math.floor(pts.length / 80));
    const s = pts.filter((_, i) => i % step === 0);
    const alts = s.map(p => Math.round(p.altitude));
    const min = Math.min(...alts), max = Math.max(...alts);
    const labels = s.map((_, i) => i % 10 === 0
      ? new Date(s[i].timestamp).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }) : '');
    return { labels, alts, min, max, gain: max - min };
  }, [points]);

  if (!data) return (
    <div className="h-full flex flex-col items-center justify-center" style={{ color:'var(--c-border2)' }}>
      <Mountain size={26} className="mb-2"/><p className="font-mono text-xs">No elevation data</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-2">
        {[['Min', data.min+'m', 'var(--c-muted)'], ['Max', data.max+'m', 'var(--c-text)'], ['Gain', '+'+data.gain+'m', '#22d3a0']].map(([l,v,c]) => (
          <span key={l} className="font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>
            {l}: <strong style={{ color: c }}>{v}</strong>
          </span>
        ))}
      </div>
      <div className="flex-1">
        <Line data={{ labels: data.labels, datasets: [{
          data: data.alts, borderColor:'#c084fc', backgroundColor:'rgba(192,132,252,0.07)',
          fill:true, tension:0.3, pointRadius:0, pointHoverRadius:4, borderWidth:2,
        }]}} options={{
          responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', borderColor:'#243044', borderWidth:1, callbacks:{ label: ctx=>`${ctx.parsed.y}m` }}},
          scales: {
            x: { grid:{color:'rgba(28,37,53,0.8)'}, ticks:{color:'#374151',font:{size:10},maxTicksLimit:6} },
            y: { grid:{color:'rgba(28,37,53,0.8)'}, ticks:{color:'#374151',font:{size:10},callback:v=>`${v}m`} },
          },
        }}/>
      </div>
    </div>
  );
}

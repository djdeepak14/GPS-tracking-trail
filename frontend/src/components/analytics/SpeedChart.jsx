import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Gauge } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function SpeedChart({ points = [] }) {
  const data = useMemo(() => {
    const pts = points.filter(p => p.speed != null && p.speed >= 0);
    if (pts.length < 2) return null;
    const step = Math.max(1, Math.floor(pts.length / 80));
    const s = pts.filter((_, i) => i % step === 0);
    const speeds = s.map(p => +(p.speed * 3.6).toFixed(1));
    const labels = s.map((_, i) => i % 10 === 0
      ? new Date(s[i].timestamp).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }) : '');
    const max = Math.max(...speeds);
    const avg = (speeds.reduce((a,b)=>a+b,0)/speeds.length).toFixed(1);
    return { labels, speeds, max, avg };
  }, [points]);

  if (!data) return (
    <div className="h-full flex flex-col items-center justify-center" style={{ color:'var(--c-border2)' }}>
      <Gauge size={26} className="mb-2"/><p className="font-mono text-xs">No speed data</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-2">
        <span className="font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>
          Avg: <strong style={{ color:'var(--c-text)' }}>{data.avg} km/h</strong>
        </span>
        <span className="font-mono text-[10px]" style={{ color:'var(--c-muted)' }}>
          Max: <strong style={{ color:'#f59e0b' }}>{data.max.toFixed(1)} km/h</strong>
        </span>
      </div>
      <div className="flex-1">
        <Line data={{ labels: data.labels, datasets: [{
          data: data.speeds, borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.07)',
          fill:true, tension:0.4, pointRadius:0, pointHoverRadius:4, borderWidth:2,
        }]}} options={{
          responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', borderColor:'#243044', borderWidth:1, callbacks:{label:ctx=>`${ctx.parsed.y} km/h`}}},
          scales: {
            x: { grid:{color:'rgba(28,37,53,0.8)'}, ticks:{color:'#374151',font:{size:10},maxTicksLimit:6} },
            y: { grid:{color:'rgba(28,37,53,0.8)'}, ticks:{color:'#374151',font:{size:10}} },
          },
        }}/>
      </div>
    </div>
  );
}

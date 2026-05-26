import React from 'react';
import { Satellite, WifiOff } from 'lucide-react';

export default function GPSBadge({ isTracking, isPaused, accuracy, error }) {
  if (error) return (
    <div className="badge badge-red gap-1.5"><WifiOff size={11}/> GPS Error</div>
  );
  if (!isTracking && !isPaused) return (
    <div className="badge gap-1.5" style={{ background:'var(--c-faint)', border:'1px solid var(--c-border2)', color:'var(--c-muted)' }}>
      <Satellite size={11}/> GPS Off
    </div>
  );
  if (isPaused) return (
    <div className="badge badge-amber gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-current"/>Paused
    </div>
  );
  const c = accuracy ? (accuracy < 10 ? '#22d3a0' : accuracy < 30 ? '#f59e0b' : '#f87171') : '#22d3a0';
  return (
    <div className="badge badge-green gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c }}/>
      <Satellite size={11}/>
      {accuracy ? `±${Math.round(accuracy)}m` : 'Tracking'}
    </div>
  );
}

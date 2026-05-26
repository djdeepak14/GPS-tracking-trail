import React, { useState } from 'react';
import { AlertTriangle, X, Share2, Map } from 'lucide-react';

export default function SOSButton({ position }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCoords = () => {
    if (!position) return;
    navigator.clipboard.writeText(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="map-fab"
        style={{ color:'#f87171', background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)' }}
        title="Emergency SOS">
        <AlertTriangle size={16}/>
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)}/>
          <div className="relative glass rounded-2xl p-5 w-72 shadow-2xl anim-scalein border"
            style={{ borderColor:'rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)' }}>
                <AlertTriangle size={18} color="#f87171"/>
              </div>
              <div>
                <p className="font-display font-bold text-sm" style={{ color:'var(--c-text)' }}>Emergency SOS</p>
                <p className="text-xs" style={{ color:'var(--c-muted)' }}>Share your location</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto" style={{ color:'var(--c-muted)' }}><X size={16}/></button>
            </div>

            <div className="rounded-lg px-3 py-2.5 mb-4 font-mono text-xs" style={{ background:'var(--c-faint)' }}>
              {position
                ? <span style={{ color:'var(--c-accent)' }}>{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
                : <span style={{ color:'var(--c-muted)' }}>No GPS fix yet — start tracking</span>}
            </div>

            <div className="space-y-2">
              <button onClick={copyCoords} disabled={!position} className="btn btn-ghost w-full justify-center text-xs">
                <Share2 size={13}/> {copied ? '✓ Copied!' : 'Copy Coordinates'}
              </button>
              <button disabled={!position} onClick={() => window.open(`https://maps.google.com/?q=${position.lat},${position.lng}`, '_blank')}
                className="btn btn-danger w-full justify-center text-xs">
                <Map size={13}/> Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation, Square, Pause, Play, Layers, Crosshair,
  AlertCircle, Clock, Gauge, Mountain, Route as RouteIcon,
  Radio, ChevronDown, Plus, AlertTriangle, Share2, X
} from 'lucide-react';
import { useTrackingStore } from '../store/trackingStore';
import { useAuthStore } from '../store/authStore';
import { formatDistance, formatSpeed, formatDuration } from '../utils/formatters';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makePositionIcon = (color = '#22d3a0') => L.divIcon({
  className: '',
  html: `<div style="position:relative;width:16px;height:16px;">
    <div style="position:absolute;inset:0;background:${color};border-radius:50%;border:2.5px solid #080c12;box-shadow:0 0 12px ${color}88;z-index:2;"></div>
    <div style="position:absolute;inset:-8px;background:${color};border-radius:50%;opacity:0;animation:ping2 2.5s ease-out infinite;"></div>
  </div>`,
  iconSize: [16, 16], 
  iconAnchor: [8, 8],
});

const MAP_TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    label: 'Dark',
    attribution: '&copy; OpenStreetMap &copy; CartoDB'
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'Street',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    label: 'Satellite',
    attribution: '&copy; Esri'
  },
  topo: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    label: 'Topo',
    attribution: '&copy; OpenStreetMap &copy; OpenTopoMap'
  },
};

function MapCenterController({ position, auto }) {
  const map = useMap();
  useEffect(() => {
    if (position && auto) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [position, auto, map]);
  return null;
}

const TYPE_OPTS = ['walking','running','hiking','cycling','driving','other'];

export default function MapPage() {
  const {
    isTracking, isPaused, currentPosition, currentSpeed, currentAltitude, accuracy,
    livePoints, stats, activeRoute,
    startTracking, stopTracking, pauseTracking, resumeTracking, addPoint, setWatchId,
  } = useTrackingStore();
  const { user } = useAuthStore();

  const [tile, setTile]           = useState('dark');
  const [showTiles, setShowTiles] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [histRoutes, setHistRoutes]   = useState([]);
  const [gpsError, setGpsError]       = useState(null);
  const [toast, setToast]             = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [showSOS, setShowSOS]         = useState(false);
  const [form, setForm] = useState({ name: '', type: 'walking', color: '#22d3a0' });
  const [elapsed, setElapsed] = useState(0);
  const watchRef = useRef(null);
  const timerRef = useRef(null);

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load history
  useEffect(() => {
    api.get('/routes?status=completed&limit=6').then(r => setHistRoutes(r.data.data || [])).catch(()=>{});
  }, [isTracking]);

  // Elapsed timer
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (!isTracking) setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking, isPaused]);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { 
      setGpsError('Geolocation not supported'); 
      return; 
    }
    const id = navigator.geolocation.watchPosition(
      pos => { 
        setGpsError(null); 
        addPoint(pos); 
      },
      err => setGpsError(['Access denied','Position unavailable','Timeout'][err.code-1] || 'GPS error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    watchRef.current = id;
    setWatchId(id);
  }, [addPoint, setWatchId]);

  const stopGPS = () => {
    if (watchRef.current !== null) { 
      navigator.geolocation.clearWatch(watchRef.current); 
      watchRef.current = null; 
    }
  };

  const handleStart = async () => {
    setShowForm(false);
    const r = await startTracking(form);
    if (r.success) { 
      startGPS(); 
      notify('Tracking started'); 
    }
    else notify(r.message, 'err');
  };

  const handleStop = async () => {
    stopGPS();
    const r = await stopTracking();
    if (r.success) notify(`Route saved · ${formatDistance(r.route?.stats?.totalDistance)}`);
  };

  const handlePause = async () => { 
    stopGPS(); 
    await pauseTracking(); 
    notify('Tracking paused'); 
  };
  
  const handleResume = async () => { 
    await resumeTracking(); 
    startGPS(); 
    notify('Tracking resumed'); 
  };

  const trailColor = activeRoute?.color || user?.preferences?.defaultTrailColor || '#22d3a0';
  const linePos = livePoints.map(p => [p.lat, p.lng]);
  const center = currentPosition ? [currentPosition.lat, currentPosition.lng] : [60.1699, 24.9384];

  const copySOS = () => {
    if (!currentPosition) return;
    navigator.clipboard.writeText(`${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`);
    notify('Coordinates copied');
    setShowSOS(false);
  };

  return (
    <div className="relative w-full h-full" style={{ background: 'var(--c-bg)' }}>

      {/* ── Map ── */}
      <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer 
          url={MAP_TILES[tile].url} 
          attribution={MAP_TILES[tile].attribution} 
        />
        <MapCenterController position={currentPosition} auto={autoCenter} />

        {linePos.length > 1 && (
          <Polyline positions={linePos} color={trailColor} weight={3.5} opacity={0.95} smoothFactor={1.5} />
        )}
        
        {currentPosition && accuracy && (
          <Circle 
            center={[currentPosition.lat, currentPosition.lng]} 
            radius={accuracy}
            color={trailColor} 
            fillColor={trailColor} 
            fillOpacity={0.04} 
            weight={1} 
            opacity={0.25} 
          />
        )}

        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={makePositionIcon(trailColor)}>
            <Popup>
              <div className="font-mono text-xs space-y-1 py-1">
                <p className="font-semibold" style={{ color: 'var(--c-accent)' }}>Current Position</p>
                <p style={{ color: 'var(--c-text)' }}>
                  {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                </p>
                {currentAltitude && <p style={{ color: 'var(--c-muted)' }}>Alt: {Math.round(currentAltitude)}m</p>}
                {currentSpeed && <p style={{ color: 'var(--c-muted)' }}>Speed: {formatSpeed(currentSpeed)}</p>}
              </div>
            </Popup>
          </Marker>
        )}

        {showHistory && histRoutes.map(r => {
          const pts = r.points?.map(p => [p.lat, p.lng]) || [];
          return pts.length > 1 ? (
            <Polyline 
              key={r._id} 
              positions={pts} 
              color={r.color || '#3b82f6'} 
              weight={2} 
              opacity={0.35} 
            />
          ) : null;
        })}
      </MapContainer>
      
      {/* ── Toast ── */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass px-4 py-2.5
          rounded-xl text-sm font-medium shadow-2xl notif border
          ${toast.type === 'err'
            ? 'text-red-400 border-red-500/30'
            : 'border-[var(--c-border2)]'}`}
          style={{ color: toast.type === 'err' ? undefined : 'var(--c-text)' }}>
          {toast.msg}
        </div>
      )}

      {/* ── GPS Error ── */}
      {gpsError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2
          px-4 py-2.5 rounded-xl text-sm max-w-xs shadow-2xl"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle size={15} />
          <span>{gpsError}</span>
        </div>
      )}

      {/* ── Right FABs ── */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Tile picker */}
        <div className="relative">
          <button onClick={() => setShowTiles(!showTiles)} className={`map-fab ${showTiles ? 'active' : ''}`} title="Map style">
            <Layers size={16} />
          </button>
          {showTiles && (
            <div className="absolute right-0 top-11 w-32 rounded-xl overflow-hidden shadow-2xl anim-scalein"
              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border2)' }}>
              {Object.entries(MAP_TILES).map(([key, { label }]) => (
                <button key={key} onClick={() => { setTile(key); setShowTiles(false); }}
                  className="w-full px-3 py-2.5 text-left text-xs font-display transition-colors"
                  style={{
                    color: tile === key ? 'var(--c-accent)' : 'var(--c-muted)',
                    background: tile === key ? 'rgba(34,211,160,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if(tile !== key) e.currentTarget.style.background = 'var(--c-faint)'; }}
                  onMouseLeave={e => { if(tile !== key) e.currentTarget.style.background = 'transparent'; }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setAutoCenter(!autoCenter)} title="Auto-center"
          className={`map-fab ${autoCenter ? 'active' : ''}`}>
          <Crosshair size={16} />
        </button>

        <button onClick={() => setShowHistory(!showHistory)} title="Route history"
          className={`map-fab ${showHistory ? 'active' : ''}`}
          style={showHistory ? { color: '#60a5fa', background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.35)' } : {}}>
          <RouteIcon size={16} />
        </button>

        {/* SOS */}
        <button onClick={() => setShowSOS(true)} title="Emergency SOS"
          className="map-fab"
          style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={16} />
        </button>
      </div>

      {/* ── Live Stats HUD ── */}
      {(isTracking || isPaused) && (
        <div className="absolute top-4 left-4 z-[500] space-y-2 w-52">
          {/* Elapsed */}
          <div className="glass rounded-xl px-3 py-2.5 border" style={{ borderColor: 'var(--c-border2)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isTracking && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold" style={{ color: 'var(--c-accent)' }}>
                {formatDuration(elapsed)}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: RouteIcon, label: 'Dist',  val: formatDistance(stats.totalDistance), c: 'var(--c-accent)' },
              { icon: Gauge,     label: 'Speed', val: formatSpeed(currentSpeed || 0),       c: '#60a5fa' },
              { icon: Mountain,  label: 'Alt',   val: currentAltitude ? `${Math.round(currentAltitude)}m` : '—', c: '#c084fc' },
              { icon: Clock,     label: 'Avg',   val: formatSpeed(stats.avgSpeed || 0),     c: '#f59e0b' },
            ].map(({ icon: Icon, label, val, c }) => (
              <div key={label} className="glass rounded-xl px-2.5 py-2 border" style={{ borderColor: 'var(--c-border2)' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon size={10} style={{ color: c }} />
                  <span className="font-mono text-[8px] uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>{label}</span>
                </div>
                <p className="font-mono text-xs font-semibold leading-none" style={{ color: 'var(--c-text)' }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Start Form Modal ── */}
      {showForm && (
        <div className="absolute inset-0 z-[600] flex items-end justify-center pb-24">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative glass rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl anim-fadeup border"
            style={{ borderColor: 'var(--c-border2)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-sm" style={{ color: 'var(--c-text)' }}>New Session</p>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--c-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Route name (optional)"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input text-sm" />
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="select w-full text-sm">
                {TYPE_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div className="flex items-center gap-3">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>Trail color</label>
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className="font-mono text-xs" style={{ color: 'var(--c-muted)' }}>{form.color}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost flex-1 justify-center text-xs">Cancel</button>
              <button onClick={handleStart} className="btn btn-primary flex-1 justify-center text-xs">
                <Radio size={13} /> Start GPS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOS Modal ── */}
      {showSOS && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSOS(false)} />
          <div className="relative glass rounded-2xl p-5 w-72 shadow-2xl anim-scalein border"
            style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertTriangle size={18} color="#f87171" />
              </div>
              <div>
                <p className="font-display font-bold text-sm" style={{ color: 'var(--c-text)' }}>Emergency SOS</p>
                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Share your location</p>
              </div>
              <button onClick={() => setShowSOS(false)} className="ml-auto" style={{ color: 'var(--c-muted)' }}><X size={16} /></button>
            </div>
            {currentPosition ? (
              <div className="rounded-lg px-3 py-2.5 mb-4 font-mono text-xs" style={{ background: 'var(--c-faint)', color: 'var(--c-accent)' }}>
                {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
              </div>
            ) : (
              <div className="rounded-lg px-3 py-2.5 mb-4 text-xs" style={{ background: 'var(--c-faint)', color: 'var(--c-muted)' }}>
                No GPS fix yet
              </div>
            )}
            <div className="space-y-2">
              <button onClick={copySOS} disabled={!currentPosition}
                className="btn btn-ghost w-full justify-center text-xs">
                <Share2 size={13} /> Copy Coordinates
              </button>
              <button disabled={!currentPosition}
                onClick={() => window.open(`https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`, '_blank')}
                className="btn btn-danger w-full justify-center text-xs">
                <AlertTriangle size={13} /> Open in Maps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Control Bar ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[500]">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border"
          style={{ borderColor: 'var(--c-border2)' }}>
          {!isTracking && !isPaused ? (
            <button onClick={() => setShowForm(true)}
              className="btn btn-primary px-6"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
              <Navigation size={16} /> Start Tracking
            </button>
          ) : (
            <>
              {isPaused ? (
                <button onClick={handleResume} className="btn text-sm"
                  style={{ background: 'rgba(34,211,160,0.12)', color: 'var(--c-accent)', border: '1px solid rgba(34,211,160,0.3)' }}>
                  <Play size={14} /> Resume
                </button>
              ) : (
                <button onClick={handlePause} className="btn text-sm"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Pause size={14} /> Pause
                </button>
              )}
              <button onClick={handleStop} className="btn btn-danger text-sm">
                <Square size={14} /> Stop
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

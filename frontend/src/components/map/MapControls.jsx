import React from 'react';
import { Layers, Crosshair, Route, ZoomIn, ZoomOut } from 'lucide-react';

export default function MapControls({ onZoomIn, onZoomOut, onToggleLayers, onToggleAutoCenter, onToggleHistory, autoCenter, showHistory, showingLayers }) {
  return (
    <div className="flex flex-col gap-2">
      <button onClick={onZoomIn}  className="map-fab" title="Zoom in"><ZoomIn  size={16}/></button>
      <button onClick={onZoomOut} className="map-fab" title="Zoom out"><ZoomOut size={16}/></button>
      <div style={{ height:1, background:'var(--c-border)', margin:'2px 0' }}/>
      <button onClick={onToggleLayers}     className={`map-fab ${showingLayers ? 'active' : ''}`} title="Map style"><Layers   size={16}/></button>
      <button onClick={onToggleAutoCenter} className={`map-fab ${autoCenter   ? 'active' : ''}`} title="Auto-center"><Crosshair size={16}/></button>
      <button onClick={onToggleHistory}    className={`map-fab ${showHistory  ? 'active' : ''}`}
        style={showHistory ? { color:'#60a5fa', background:'rgba(59,130,246,0.1)', borderColor:'rgba(59,130,246,0.35)' } : {}}
        title="Route history"><Route size={16}/></button>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Star, Trash2, X, Edit3, ChevronRight, Route as RouteIcon } from 'lucide-react';
import { formatDistance, formatDuration, formatDate, formatSpeed, getRouteTypeIcon } from '../utils/formatters';
import api from '../services/api';

const TYPES = ['all','hiking','walking','running','cycling','driving','other'];

export default function HistoryPage() {
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [typeF,     setTypeF]     = useState('all');
  const [favOnly,   setFavOnly]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [pagination,setPagination]= useState({});
  const [selected,  setSelected]  = useState(null);
  const [fullRoute, setFullRoute] = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState('');
  const [confirmDel,setConfirmDel]= useState(false);
  const [toast,     setToast]     = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 20, status: 'completed',
        ...(search && { search }), ...(typeF !== 'all' && { type: typeF }),
        ...(favOnly && { favorite: 'true' }) });
      const r = await api.get(`/routes?${q}`);
      setRoutes(r.data.data || []);
      setPagination(r.data.pagination || {});
    } finally { setLoading(false); }
  }, [page, search, typeF, favOnly]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const selectRoute = async (route) => {
    setSelected(route); setConfirmDel(false); setEditing(false);
    const full = await api.get(`/routes/${route._id}`);
    setFullRoute(full.data.data);
  };

  const toggleFav = async (route) => {
    await api.patch(`/routes/${route._id}`, { isFavorite: !route.isFavorite });
    setRoutes(p => p.map(r => r._id === route._id ? { ...r, isFavorite: !r.isFavorite } : r));
    if (selected?._id === route._id) setSelected(s => ({ ...s, isFavorite: !s.isFavorite }));
  };

  const saveName = async () => {
    if (!editName.trim() || !selected) return;
    await api.patch(`/routes/${selected._id}`, { name: editName });
    setRoutes(p => p.map(r => r._id === selected._id ? { ...r, name: editName } : r));
    setSelected(s => ({ ...s, name: editName }));
    setEditing(false); notify('Route renamed');
  };

  const deleteRoute = async () => {
    await api.delete(`/routes/${selected._id}`);
    setRoutes(p => p.filter(r => r._id !== selected._id));
    setSelected(null); setFullRoute(null); notify('Route deleted');
  };

  const doExport = async (fmt) => {
    const r = await api.get(`/routes/${selected._id}/export?format=${fmt}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url;
    a.download = `${selected.name}.${fmt}`; a.click();
  };

  return (
    <div className="h-full flex" style={{ background: 'var(--c-bg)' }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass px-4 py-2.5 rounded-xl text-sm shadow-2xl notif border"
          style={{ borderColor: 'var(--c-border2)', color: 'var(--c-text)' }}>{toast}</div>
      )}

      {/* ── List panel ── */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--c-text)' }}>Route History</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-44">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-muted)' }} />
              <input type="text" placeholder="Search routes…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-8 text-sm" />
            </div>
            <select value={typeF} onChange={e => { setTypeF(e.target.value); setPage(1); }}
              className="select text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <button onClick={() => setFavOnly(!favOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all border
                ${favOnly ? 'badge badge-amber' : 'btn btn-ghost text-xs'}`}>
              ★ Fav
            </button>
          </div>
        </div>

        {/* Route list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_,i) => <div key={i} className="skeleton h-[66px] rounded-xl" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-20">
            <RouteIcon size={36} style={{ color: 'var(--c-border2)' }} className="mx-auto mb-3" />
            <p style={{ color: 'var(--c-muted)' }}>No routes found</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {routes.map(route => (
              <div key={route._id} onClick={() => selectRoute(route)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border"
                style={{
                  background: selected?._id === route._id ? 'rgba(34,211,160,0.05)' : 'var(--c-panel)',
                  borderColor: selected?._id === route._id ? 'rgba(34,211,160,0.22)' : 'var(--c-border)',
                }}
                onMouseEnter={e => { if (selected?._id !== route._id) e.currentTarget.style.borderColor = 'var(--c-border2)'; }}
                onMouseLeave={e => { if (selected?._id !== route._id) e.currentTarget.style.borderColor = 'var(--c-border)'; }}>
                <span className="text-xl flex-shrink-0">{getRouteTypeIcon(route.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-xs font-semibold truncate" style={{ color: 'var(--c-text)' }}>{route.name}</p>
                    {route.isFavorite && <Star size={11} style={{ color: '#fbbf24', fill: '#fbbf24' }} className="flex-shrink-0" />}
                  </div>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--c-muted)' }}>{formatDate(route.startTime)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{formatDistance(route.stats?.totalDistance)}</p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--c-muted)' }}>{formatDuration(route.stats?.totalDuration, true)}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: route.color || '#22d3a0' }} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-ghost text-xs">← Prev</button>
            <span className="font-mono text-xs" style={{ color: 'var(--c-muted)' }}>{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="btn btn-ghost text-xs">Next →</button>
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div className="w-72 shrink-0 overflow-y-auto border-l" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          <div className="p-4 space-y-4">

            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              {editing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    className="input text-xs flex-1 py-1.5" autoFocus />
                  <button onClick={saveName} style={{ color: 'var(--c-accent)' }} className="text-xs font-mono hover:underline">Save</button>
                  <button onClick={() => setEditing(false)} style={{ color: 'var(--c-muted)' }}><X size={13} /></button>
                </div>
              ) : (
                <>
                  <p className="font-display text-sm font-bold flex-1 min-w-0 pr-2 truncate" style={{ color: 'var(--c-text)' }}>{selected.name}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => { setEditing(true); setEditName(selected.name); }} style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => { setSelected(null); setFullRoute(null); }} style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
                      <X size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Distance', formatDistance(selected.stats?.totalDistance)],
                ['Duration', formatDuration(selected.stats?.totalDuration, true)],
                ['Avg Speed', formatSpeed(selected.stats?.avgSpeed)],
                ['Max Speed', formatSpeed(selected.stats?.maxSpeed)],
                ['Stops', selected.stats?.stopCount || 0],
                ['Points', selected.stats?.pointCount || 0],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg px-3 py-2.5 border" style={{ background: 'var(--c-panel)', borderColor: 'var(--c-border)' }}>
                  <p className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--c-muted)' }}>{l}</p>
                  <p className="font-mono text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{v}</p>
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            {/* Actions */}
            <button onClick={() => toggleFav(selected)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-display font-semibold border transition-all
                ${selected.isFavorite ? 'badge badge-amber' : 'btn btn-ghost'}`}>
              <Star size={13} className={selected.isFavorite ? 'fill-current' : ''} />
              {selected.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
            </button>

            {/* Export */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: 'var(--c-muted)' }}>Export as</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['gpx','csv','json'].map(f => (
                  <button key={f} onClick={() => doExport(f)}
                    className="py-2 rounded-lg text-[10px] font-mono uppercase tracking-wide transition-all border"
                    style={{ background: 'var(--c-faint)', color: 'var(--c-muted)', borderColor: 'var(--c-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.borderColor = 'var(--c-border2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.borderColor = 'var(--c-border)'; }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-divider" />

            {/* Delete */}
            {confirmDel ? (
              <div className="rounded-xl p-3 border space-y-2" style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}>
                <p className="text-xs" style={{ color: '#f87171' }}>Delete this route permanently?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDel(false)} className="btn btn-ghost flex-1 justify-center text-xs py-1.5">Cancel</button>
                  <button onClick={deleteRoute} className="btn btn-danger flex-1 justify-center text-xs py-1.5">Delete</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="btn btn-danger w-full justify-center text-xs">
                <Trash2 size={13} /> Delete Route
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

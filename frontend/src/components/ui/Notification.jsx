import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Ctx = createContext(null);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = useCallback((msg, type = 'success', ms = 3500) => {
    const id = Date.now() + Math.random();
    setItems(p => [...p, { id, msg, type }]);
    setTimeout(() => setItems(p => p.filter(n => n.id !== id)), ms);
  }, []);

  const remove = useCallback((id) => setItems(p => p.filter(n => n.id !== id)), []);

  return (
    <Ctx.Provider value={{ add }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {items.map(n => {
          const cfg = {
            success: { bg:'rgba(34,211,160,0.15)', border:'rgba(34,211,160,0.3)', color:'#22d3a0', Icon: CheckCircle },
            error:   { bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.3)',  color:'#f87171', Icon: AlertCircle },
            info:    { bg:'rgba(59,130,246,0.15)',  border:'rgba(59,130,246,0.3)', color:'#60a5fa', Icon: Info },
          }[n.type] || {};
          const { Icon } = cfg;
          return (
            <div key={n.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl notif"
              style={{ background: cfg.bg, border:`1px solid ${cfg.border}`, color: cfg.color, minWidth:200, maxWidth:300 }}>
              <Icon size={15} className="flex-shrink-0" />
              <span className="text-sm font-medium flex-1" style={{ color:'var(--c-text)' }}>{n.msg}</span>
              <button onClick={() => remove(n.id)} style={{ color:'var(--c-muted)' }}><X size={13} /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotification must be inside NotificationProvider');
  return ctx;
}

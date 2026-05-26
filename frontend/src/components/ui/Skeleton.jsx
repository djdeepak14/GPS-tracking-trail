import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-8 w-1/3 rounded-lg" />
    </div>
  );
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ background:'var(--c-panel)', border:'1px solid var(--c-border)' }}>
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded-lg" />
          </div>
          <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-40' }) {
  return (
    <div className={`${height} flex items-end gap-1 px-2`}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="skeleton flex-1 rounded-t" style={{ height:`${25+Math.random()*70}%` }} />
      ))}
    </div>
  );
}

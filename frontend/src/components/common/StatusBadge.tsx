import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = (status || 'UNKNOWN').toUpperCase();

  const config: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    RUNNING: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-600/50', dot: 'bg-purple-400 animate-ping' },
    QUEUED: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-600/50', dot: 'bg-indigo-400' },
    COMPLETED: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-600/50', dot: 'bg-emerald-400' },
    SUCCESS: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-600/50', dot: 'bg-emerald-400' },
    UP: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-600/50', dot: 'bg-emerald-400' },
    FAILED: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-600/50', dot: 'bg-rose-400' },
    DOWN: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-600/50', dot: 'bg-rose-400' },
    CANCELLED: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500' },
    OPERATIONAL: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-600/50', dot: 'bg-emerald-400' },
    DEGRADED: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-600/50', dot: 'bg-amber-400' },
    UNAVAILABLE: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-600/50', dot: 'bg-rose-400' },
  };

  const current = config[s] || { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700', dot: 'bg-slate-500' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}>
      <span className={`relative flex h-2 w-2`}>
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot.replace('animate-ping', '')}`}></span>
      </span>
      {s}
    </span>
  );
};

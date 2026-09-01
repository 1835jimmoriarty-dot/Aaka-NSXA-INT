import React from 'react';

interface SeverityBadgeProps {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'LOW').toUpperCase();
  
  const styles = {
    CRITICAL: 'bg-red-950/70 text-red-400 border-red-800/80 shadow-[0_0_10px_rgba(239,68,68,0.25)]',
    HIGH: 'bg-orange-950/70 text-orange-400 border-orange-800/80 shadow-[0_0_10px_rgba(249,115,22,0.25)]',
    MEDIUM: 'bg-amber-950/70 text-amber-400 border-amber-800/80',
    LOW: 'bg-blue-950/70 text-blue-400 border-blue-800/80',
    INFORMATIONAL: 'bg-slate-900/70 text-slate-400 border-slate-700/80',
  }[sev] || 'bg-slate-900/70 text-slate-400 border-slate-700/80';

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded-md border ${styles} ${sizeStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {sev}
    </span>
  );
};

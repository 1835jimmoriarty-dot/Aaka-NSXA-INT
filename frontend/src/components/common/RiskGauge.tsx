import React, { useState } from 'react';
import { ShieldAlert, Info, X } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  level?: string;
  factorsJson?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, factorsJson, size = 'md' }) => {
  const [showFactors, setShowFactors] = useState(false);
  const normalized = Math.min(100, Math.max(0, score));

  let color = '#3B82F6';
  let badgeBg = 'bg-blue-950/60 border-blue-600/40 text-blue-300';
  if (normalized >= 70) {
    color = '#EF4444';
    badgeBg = 'bg-red-950/60 border-red-600/40 text-red-300';
  } else if (normalized >= 50) {
    color = '#F97316';
    badgeBg = 'bg-orange-950/60 border-orange-600/40 text-orange-300';
  } else if (normalized >= 25) {
    color = '#F59E0B';
    badgeBg = 'bg-amber-950/60 border-amber-600/40 text-amber-300';
  }

  let parsedFactors: string[] = [];
  try {
    if (factorsJson) parsedFactors = JSON.parse(factorsJson);
  } catch {}

  return (
    <div className="inline-flex items-center gap-2 relative">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono font-bold ${badgeBg} cursor-pointer hover:border-brand-bright transition-colors`}
        onClick={() => parsedFactors.length > 0 && setShowFactors(!showFactors)}
        title="Click to view explainable risk factors"
      >
        <ShieldAlert className="w-4 h-4 text-current" />
        <span>{normalized}</span>
        <span className="text-[10px] opacity-70">/100</span>
        {parsedFactors.length > 0 && <Info className="w-3.5 h-3.5 opacity-60 ml-0.5" />}
      </div>

      {showFactors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#9B5CFF]" />
                <h3 className="text-lg font-semibold text-[#F5F3FF]">Explainable Risk Intelligence</h3>
              </div>
              <button
                onClick={() => setShowFactors(false)}
                className="p-1 rounded-lg hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-lg bg-[#080611] border border-[#282245] flex items-center justify-between">
              <div>
                <div className="text-xs text-[#A8A3B8] uppercase tracking-wider">Calculated Risk Score</div>
                <div className="text-2xl font-bold text-[#F5F3FF] font-mono mt-1">{normalized} <span className="text-sm text-[#A8A3B8]">/ 100</span></div>
              </div>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeBg}`}>
                {level || (normalized >= 70 ? 'CRITICAL' : normalized >= 50 ? 'HIGH' : normalized >= 25 ? 'MEDIUM' : 'LOW')}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-medium text-[#A8A3B8] uppercase tracking-wider mb-2">Score Contributing Factors:</div>
              {parsedFactors.map((f, i) => (
                <div key={i} className="text-xs p-2.5 rounded-md bg-[#18142A] border border-[#282245] text-[#F5F3FF] flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9B5CFF] mt-1.5 shrink-0"></span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFactors(false)}
                className="px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold transition-colors"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

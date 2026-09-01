import React, { useState, useMemo } from 'react';
import { Host } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { Shield, Server, ZoomIn, ZoomOut, RotateCcw, Filter, ArrowRight, ExternalLink } from 'lucide-react';

interface NetworkGraphProps {
  hosts: Host[];
  onSelectHost: (hostId: number) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ hosts, onSelectHost }) => {
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Group hosts by subnet /24
  const subnets = useMemo(() => {
    const map = new Map<string, Host[]>();
    hosts.forEach((h) => {
      if (filterRisk !== 'ALL' && h.risk_level !== filterRisk) return;
      const parts = h.ip.split('.');
      const subnetKey = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : 'Default Network';
      if (!map.has(subnetKey)) {
        map.set(subnetKey, []);
      }
      map.get(subnetKey)?.push(h);
    });
    return map;
  }, [hosts, filterRisk]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-[650px] rounded-2xl bg-[#080611] border border-[#282245] overflow-hidden select-none">
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#121022]/90 backdrop-blur-md border border-[#282245] p-1.5 rounded-xl shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          className="p-1.5 rounded-lg hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF]"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="p-1.5 rounded-lg hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF]"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded-lg hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF]"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#282245] mx-1"></div>

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#A8A3B8]" />
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-[#18142A] border border-[#282245] rounded-md text-xs text-[#F5F3FF] py-1 px-2 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High & Above</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Topology Canvas Area */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing p-10 overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundImage: 'radial-gradient(#282245 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="flex flex-wrap gap-12 p-6"
        >
          {Array.from(subnets.entries()).map(([subnet, hostList], sIdx) => (
            <div
              key={subnet}
              className="p-6 rounded-3xl bg-[#0D0A19]/80 border-2 border-dashed border-[#7C3AED]/30 backdrop-blur-sm min-w-[320px] max-w-[650px] shadow-2xl relative"
            >
              <div className="absolute -top-3.5 left-6 bg-[#18142A] px-3 py-0.5 rounded-full border border-[#7C3AED]/50 text-xs font-mono text-[#9B5CFF] font-semibold flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></span>
                Subnet: {subnet} ({hostList.length} hosts)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                {hostList.map((h) => {
                  const isCritical = h.risk_level === 'CRITICAL';
                  const isHigh = h.risk_level === 'HIGH';
                  const borderGlow = isCritical
                    ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : isHigh
                    ? 'border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                    : 'border-[#282245] hover:border-[#7C3AED]/70';

                  const isCurrent = selectedHost?.id === h.id;

                  return (
                    <div
                      key={h.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHost(h);
                      }}
                      className={`p-3.5 rounded-2xl bg-[#121022] border transition-all cursor-pointer hover:scale-[1.02] ${borderGlow} ${
                        isCurrent ? 'ring-2 ring-[#9B5CFF] bg-[#18142A]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-[#9B5CFF]" />
                          <span className="text-xs font-mono font-bold text-[#F5F3FF]">{h.ip}</span>
                        </div>
                        <SeverityBadge severity={h.risk_level} size="sm" />
                      </div>

                      <div className="text-[11px] text-[#A8A3B8] truncate mb-2">
                        {h.hostname || h.os_name || 'Generic Host'}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#A8A3B8] border-t border-[#282245] pt-2">
                        <span>{h.open_port_count} Ports Open</span>
                        <span className="text-red-400">{h.vuln_count} Findings</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Host Inspector Drawer */}
      {selectedHost && (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-[#121022]/95 backdrop-blur-xl border border-[#7C3AED]/40 rounded-2xl p-5 shadow-2xl z-30 flex flex-col justify-between animate-in slide-in-from-right-10">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#9B5CFF]" />
                <div>
                  <h4 className="text-sm font-bold text-[#F5F3FF] font-mono">{selectedHost.ip}</h4>
                  <div className="text-[11px] text-[#A8A3B8]">{selectedHost.hostname || 'No DNS PTR'}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="text-xs text-[#A8A3B8] hover:text-[#F5F3FF] p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#18142A] border border-[#282245]">
                <span className="text-[#A8A3B8]">Risk Assessment:</span>
                <span className="font-bold text-[#F5F3FF] font-mono">{selectedHost.risk_score}/100 ({selectedHost.risk_level})</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#18142A] border border-[#282245] space-y-1">
                <div className="text-[10px] text-[#A8A3B8] uppercase">Operating System</div>
                <div className="font-medium text-[#F5F3FF]">{selectedHost.os_name || 'Detection in progress'}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#18142A] border border-[#282245]">
                  <div className="text-[10px] text-[#A8A3B8] uppercase">Open Ports</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{selectedHost.open_port_count}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#18142A] border border-[#282245]">
                  <div className="text-[10px] text-[#A8A3B8] uppercase">Findings</div>
                  <div className="text-base font-bold text-red-400 font-mono mt-0.5">{selectedHost.vuln_count}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectHost(selectedHost.id)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-purple"
          >
            <span>Open Host Intelligence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

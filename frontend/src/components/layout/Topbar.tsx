import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useScan } from '../../context/ScanContext';
import { Search, FolderKanban, Radio, Plus, Activity, Bell } from 'lucide-react';

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenQuickScan: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, onOpenQuickScan, onNavigateTab }) => {
  const { projects, activeProject, selectProject } = useProject();
  const { isScanning, activeScans } = useScan();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeScanCount = activeScans.size;

  return (
    <header className="h-16 bg-[#0D0A19] border-b border-[#282245] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left: Project Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-xs font-semibold text-[#F5F3FF] transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-[#9B5CFF]" />
            <span className="max-w-[220px] truncate">{activeProject?.name || 'Select Project'}</span>
            <span className="text-[10px] text-[#A8A3B8] font-normal">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-11 left-0 w-72 bg-[#121022] border border-[#7C3AED]/40 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-[#A8A3B8] uppercase px-2 py-1 tracking-wider">
                Select Scope Project
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto mt-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProject(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeProject?.id === p.id
                        ? 'bg-[#7C3AED] text-white font-semibold'
                        : 'text-[#A8A3B8] hover:text-[#F5F3FF] hover:bg-[#18142A]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] opacity-70">{p.host_count} hosts</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[#282245] mt-2 pt-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateTab('projects');
                  }}
                  className="w-full text-center text-xs text-[#9B5CFF] hover:underline py-1 font-medium"
                >
                  + Manage / Create Projects
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Scan Status Indicator */}
        {isScanning && (
          <div
            onClick={() => onNavigateTab('scans')}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/50 text-purple-300 text-xs font-mono cursor-pointer hover:bg-purple-900/80 transition-colors shadow-glow-purple"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>{activeScanCount} Scan(s) Executing Live</span>
          </div>
        )}
      </div>

      {/* Center: Quick Search Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-xs text-[#A8A3B8] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#9B5CFF]" />
            <span>Search intelligence database...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded bg-[#18142A] border border-[#282245] text-[10px] text-[#A8A3B8] font-mono">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenQuickScan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all active:scale-95"
        >
          <Radio className="w-4 h-4" />
          <span>Launch Scan</span>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-2 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-[#A8A3B8] hover:text-[#F5F3FF] transition-colors"
          title="System Health & Settings"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </header>
  );
};

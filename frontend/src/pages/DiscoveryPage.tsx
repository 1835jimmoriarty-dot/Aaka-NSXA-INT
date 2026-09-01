import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useScan } from '../context/ScanContext';
import { api } from '../api/client';
import { ScanJob } from '../types';
import { LiveTerminal } from '../components/common/LiveTerminal';
import { Zap, Shield, Search, Sliders, Play } from 'lucide-react';

export const DiscoveryPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const { liveTerminalLogs } = useScan();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('quick');
  const [targetSpec, setTargetSpec] = useState<string>('127.0.0.1');
  const [customPorts, setCustomPorts] = useState<string>('');
  const [customTiming, setCustomTiming] = useState<string>('T4');
  const [enableScripts, setEnableScripts] = useState<boolean>(false);
  const [launching, setLaunching] = useState<boolean>(false);

  useEffect(() => {
    api.getScanProfiles().then(setProfiles).catch(console.error);
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !targetSpec.trim()) return;

    try {
      setLaunching(true);
      await api.launchScan({
        project_id: activeProject.id,
        profile: selectedProfile,
        target_spec: targetSpec.trim(),
        custom_ports: customPorts || undefined,
        custom_timing: customTiming,
        enable_scripts: enableScripts,
      });
      onNavigate('scans');
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Reconnaissance & Scan Launchpad</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Orchestrate Nmap discovery, service versioning, NSE audits, and staged enumeration</p>
        </div>
        <button
          onClick={() => onNavigate('scans')}
          className="px-3.5 py-2 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-xs font-semibold text-[#F5F3FF] transition-colors"
        >
          View Scan History →
        </button>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#A8A3B8] mb-3">1. Select Scan Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((p) => {
            const isSelected = selectedProfile === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfile(p.id)}
                className={`cyber-panel p-4 cursor-pointer transition-all ${
                  isSelected ? 'border-[#7C3AED] ring-1 ring-[#9B5CFF] shadow-glow-purple bg-[#18142A]' : 'hover:border-[#7C3AED]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-[#121022] border border-[#282245] text-[#9B5CFF]">
                    {p.id === 'quick' ? <Zap className="w-4 h-4 text-amber-400" /> : p.id === 'full' ? <Sliders className="w-4 h-4 text-blue-400" /> : p.id === 'vuln_discovery' ? <Shield className="w-4 h-4 text-red-400" /> : <Search className="w-4 h-4 text-purple-400" />}
                  </div>
                  {p.recommended && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#F5F3FF] mb-1">{p.name}</h4>
                <p className="text-[11px] text-[#A8A3B8] mb-3 line-clamp-2">{p.description}</p>
                <div className="p-1.5 rounded bg-[#080611] font-mono text-[10px] text-[#9B5CFF] truncate border border-[#282245]">
                  {p.flags}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleLaunch} className="cyber-panel p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#A8A3B8]">2. Target & Configuration</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#A8A3B8] mb-1">Target Specification *</label>
            <input
              type="text"
              required
              placeholder="e.g. 127.0.0.1, 192.168.1.0/24, scanme.nmap.org"
              value={targetSpec}
              onChange={(e) => setTargetSpec(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080611] border border-[#282245] text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A3B8] mb-1">Timing Template</label>
            <select
              value={customTiming}
              onChange={(e) => setCustomTiming(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none"
            >
              <option value="T4">T4 - Aggressive (Default)</option>
              <option value="T3">T3 - Normal</option>
              <option value="T2">T2 - Polite</option>
              <option value="T5">T5 - Insane (Fastest)</option>
            </select>
          </div>
        </div>

        {selectedProfile === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#282245]">
            <div>
              <label className="block text-xs font-medium text-[#A8A3B8] mb-1">Custom Port Range</label>
              <input
                type="text"
                placeholder="e.g. 80,443,8080,1-1024 or 1-65535"
                value={customPorts}
                onChange={(e) => setCustomPorts(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#080611] border border-[#282245] text-xs font-mono text-[#F5F3FF] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="scriptsCheck"
                checked={enableScripts}
                onChange={(e) => setEnableScripts(e.target.checked)}
                className="rounded bg-[#080611] border-[#282245] text-[#7C3AED] focus:ring-0"
              />
              <label htmlFor="scriptsCheck" className="text-xs text-[#F5F3FF] cursor-pointer">
                Enable Standard NSE Script Scan (-sC)
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={launching || !targetSpec.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{launching ? 'Initializing...' : 'Execute Assessment Scan'}</span>
          </button>
        </div>
      </form>

      <LiveTerminal logs={liveTerminalLogs} title="Real-Time Subprocess & Task Console Stream" />
    </div>
  );
};

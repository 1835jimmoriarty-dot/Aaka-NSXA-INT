import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SystemHealth } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Activity, ShieldCheck, Cpu, HardDrive, BookOpen, AlertTriangle, ExternalLink } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'health' | 'config' | 'licenses'>('health');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getHealth(), api.getLicenses(), api.getConfig()])
      .then(([hData, lData, cData]) => {
        setHealth(hData);
        setLicenses(lData);
        setConfig(cData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !health) return <LoadingSpinner text="Checking system telemetry & health..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">System Settings & Health</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Tool binaries, execution constraints, component telemetry, and open source licenses</p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#282245]">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'health' ? 'border-[#7C3AED] text-[#9B5CFF]' : 'border-transparent text-[#A8A3B8] hover:text-[#F5F3FF]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Health & Tool Status</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'config' ? 'border-[#7C3AED] text-[#9B5CFF]' : 'border-transparent text-[#A8A3B8] hover:text-[#F5F3FF]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Platform Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'licenses' ? 'border-[#7C3AED] text-[#9B5CFF]' : 'border-transparent text-[#A8A3B8] hover:text-[#F5F3FF]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Open Source Licenses</span>
        </button>
      </div>

      {/* Tab 1: System Health */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="cyber-panel p-5">
              <div className="text-xs text-[#A8A3B8] uppercase font-semibold">Overall System Status</div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={health.status} />
              </div>
            </div>
            <div className="cyber-panel p-5">
              <div className="text-xs text-[#A8A3B8] uppercase font-semibold">Backend & Database</div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={health.database_status} />
              </div>
            </div>
            <div className="cyber-panel p-5">
              <div className="text-xs text-[#A8A3B8] uppercase font-semibold">Nmap Scanning Engine</div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={health.nmap_status} />
              </div>
            </div>
            <div className="cyber-panel p-5">
              <div className="text-xs text-[#A8A3B8] uppercase font-semibold">System Uptime</div>
              <div className="mt-2 font-mono text-base font-bold text-[#F5F3FF]">
                {(health.uptime_seconds / 60).toFixed(1)} minutes
              </div>
            </div>
          </div>

          {/* Integrated Tool Adapter Status */}
          <div className="cyber-panel p-6">
            <h3 className="text-sm font-bold text-[#F5F3FF] mb-4">Security Tool Adapter Registry</h3>
            <div className="space-y-3">
              {health.tools.map((t) => (
                <div key={t.name} className="p-4 rounded-xl bg-[#18142A] border border-[#282245] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F5F3FF]">{t.name}</h4>
                        {t.version && <span className="text-xs text-[#A8A3B8] font-mono">({t.version})</span>}
                      </div>
                      <p className="text-xs text-[#A8A3B8] mt-0.5">{t.description}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>

                  {t.path && (
                    <div className="text-[11px] font-mono text-[#9B5CFF] truncate">
                      Binary: {t.path}
                    </div>
                  )}

                  {!t.installed && t.install_guidance && (
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{t.install_guidance}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Configuration */}
      {activeTab === 'config' && config && (
        <div className="cyber-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#F5F3FF]">Active Engine Configurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#18142A] border border-[#282245]">
              <div className="text-[#A8A3B8] uppercase text-[10px]">Configured Nmap Binary Path</div>
              <div className="font-mono text-[#F5F3FF] mt-1 break-all">{config.nmap_path}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#18142A] border border-[#282245]">
              <div className="text-[#A8A3B8] uppercase text-[10px]">Database Connection</div>
              <div className="font-mono text-[#F5F3FF] mt-1 break-all">{config.database_url}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#18142A] border border-[#282245]">
              <div className="text-[#A8A3B8] uppercase text-[10px]">Max Concurrent Subprocess Jobs</div>
              <div className="font-mono text-[#F5F3FF] mt-1">{config.max_concurrent_jobs}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#18142A] border border-[#282245]">
              <div className="text-[#A8A3B8] uppercase text-[10px]">Default Scan Timeout</div>
              <div className="font-mono text-[#F5F3FF] mt-1">{config.scan_timeout} seconds</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Open Source Licenses */}
      {activeTab === 'licenses' && (
        <div className="cyber-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#F5F3FF]">Open Source Licenses & Attributions</h3>
          <div className="space-y-3">
            {licenses.map((lic, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#18142A] border border-[#282245]">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-[#F5F3FF]">{lic.component}</h4>
                  <span className="text-xs font-mono font-semibold text-[#9B5CFF] px-2 py-0.5 rounded bg-[#121022] border border-[#282245]">
                    {lic.license}
                  </span>
                </div>
                <p className="text-xs text-[#A8A3B8]">{lic.attribution}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

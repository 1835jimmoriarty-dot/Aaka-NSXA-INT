import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { Host } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskGauge } from '../components/common/RiskGauge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Server, Search, Filter, ArrowRight, ShieldAlert, Network } from 'lucide-react';

export const HostsPage: React.FC<{ onSelectHost: (id: number) => void; onNavigate: (tab: string) => void }> = ({
  onSelectHost,
  onNavigate,
}) => {
  const { activeProject } = useProject();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const loadHosts = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const data = await api.getHosts(activeProject.id, {
        search: search || undefined,
        risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
      });
      setHosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHosts();
  }, [activeProject, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHosts();
  };

  if (loading && hosts.length === 0) return <LoadingSpinner text="Compiling host intelligence records..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Host Intelligence</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Comprehensive host profiles, open ports, OS identification, and risk scoring</p>
        </div>
        <button
          onClick={() => onNavigate('discovery')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
        >
          <span>Discover New Hosts</span>
        </button>
      </div>

      <div className="cyber-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A8A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search IP, Hostname, OS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#A8A3B8]" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#080611] border border-[#282245] rounded-xl text-xs text-[#F5F3FF] py-1.5 px-3 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {hosts.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No Hosts Discovered"
          description="No hosts match your filter criteria or have been discovered in this project scope."
        />
      ) : (
        <div className="cyber-panel overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#282245] bg-[#0D0A19] text-[#A8A3B8] uppercase text-[10px] tracking-wider">
                <th className="p-4 font-semibold">IP / Hostname</th>
                <th className="p-4 font-semibold">Operating System</th>
                <th className="p-4 font-semibold">Open Ports</th>
                <th className="p-4 font-semibold">Findings</th>
                <th className="p-4 font-semibold">Risk Score</th>
                <th className="p-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282245]">
              {hosts.map((h) => (
                <tr
                  key={h.id}
                  onClick={() => onSelectHost(h.id)}
                  className="hover:bg-[#18142A] cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#080611] border border-[#282245] text-[#9B5CFF]">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-[#F5F3FF] text-sm">{h.ip}</div>
                        <div className="text-[11px] text-[#A8A3B8]">{h.hostname || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#F5F3FF]">
                    {h.os_name || <span className="text-[#A8A3B8]">Unknown / Generic</span>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400">
                      <Network className="w-3.5 h-3.5" />
                      {h.open_port_count} Open
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-red-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {h.vuln_count} Findings
                    </span>
                  </td>
                  <td className="p-4">
                    <RiskGauge score={h.risk_score} level={h.risk_level} factorsJson={h.risk_factors_json} size="sm" />
                  </td>
                  <td className="p-4 text-right">
                    <ArrowRight className="w-4 h-4 text-[#A8A3B8] ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

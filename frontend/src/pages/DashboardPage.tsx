import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useScan } from '../context/ScanContext';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskGauge } from '../components/common/RiskGauge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Server,
  Network,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC<{ onNavigate: (tab: string, hostId?: number) => void }> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const { isScanning } = useScan();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const data = await api.getDashboard(activeProject.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [activeProject]);

  if (loading && !stats) {
    return <LoadingSpinner text="Aggregating security intelligence..." />;
  }

  if (!stats || stats.hosts_discovered === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Security Dashboard</h1>
            <p className="text-xs text-[#A8A3B8] mt-0.5">Real-time attack surface and vulnerability metrics for {activeProject?.name}</p>
          </div>
          <button
            onClick={() => onNavigate('discovery')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
          >
            <Radio className="w-4 h-4" />
            <span>Launch Initial Discovery Scan</span>
          </button>
        </div>

        <EmptyState
          icon={Radio}
          title="No Reconnaissance Data Available"
          description="This project currently has no completed security scans or discovered hosts. Add targets and launch an initial discovery scan to generate network intelligence."
          actionText="Start Discovery Scan"
          onAction={() => onNavigate('discovery')}
        />
      </div>
    );
  }

  const severityData = [
    { name: 'Critical', value: stats.critical_findings, color: '#EF4444' },
    { name: 'High', value: stats.high_findings, color: '#F97316' },
    { name: 'Medium', value: stats.medium_findings, color: '#F59E0B' },
    { name: 'Low', value: stats.low_findings, color: '#3B82F6' },
    { name: 'Info', value: stats.info_findings, color: '#64748B' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Security Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#18142A] border border-[#7C3AED]/40 text-[#9B5CFF]">
              {activeProject?.name}
            </span>
          </div>
          <p className="text-xs text-[#A8A3B8] mt-1">Aggregated attack surface, vulnerability posture, and host intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-xs font-semibold text-[#F5F3FF] transition-colors"
          >
            Export Report
          </button>
          <button
            onClick={() => onNavigate('discovery')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
          >
            <Radio className="w-4 h-4" />
            <span>Launch Scan</span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-panel p-5 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-all">
          <div className="flex items-center justify-between text-[#A8A3B8] text-xs uppercase font-semibold">
            <span>Discovered Hosts</span>
            <Server className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-[#F5F3FF] font-mono">{stats.hosts_discovered}</div>
            <div className="text-xs text-emerald-400 font-medium">{stats.hosts_online} Online</div>
          </div>
          <div className="mt-2 text-[11px] text-[#A8A3B8]">Across {stats.total_assets} configured scope targets</div>
        </div>

        <div className="cyber-panel p-5 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-all">
          <div className="flex items-center justify-between text-[#A8A3B8] text-xs uppercase font-semibold">
            <span>Open Port Exposure</span>
            <Network className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-[#F5F3FF] font-mono">{stats.open_ports_count}</div>
            <div className="text-xs text-blue-400 font-medium">{stats.total_services} Services</div>
          </div>
          <div className="mt-2 text-[11px] text-[#A8A3B8]">Exposed TCP / UDP attack surface</div>
        </div>

        <div className="cyber-panel p-5 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-all">
          <div className="flex items-center justify-between text-[#A8A3B8] text-xs uppercase font-semibold">
            <span>Security Findings</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-[#F5F3FF] font-mono">{stats.total_vulns}</div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-400 border border-red-800 text-[10px] font-bold font-mono">
                {stats.critical_findings} CRIT
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-950/70 text-orange-400 border border-orange-800 text-[10px] font-bold font-mono">
                {stats.high_findings} HIGH
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#A8A3B8]">Correlated CVEs & configuration flaws</div>
        </div>

        <div className="cyber-panel p-5 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-all">
          <div className="flex items-center justify-between text-[#A8A3B8] text-xs uppercase font-semibold">
            <span>Network Risk Score</span>
            <TrendingUp className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-[#F5F3FF] font-mono">{stats.overall_risk_score} <span className="text-xs text-[#A8A3B8]">/ 100</span></div>
            <SeverityBadge severity={stats.risk_level} size="sm" />
          </div>
          <div className="mt-2 text-[11px] text-[#A8A3B8]">Weighted explainable exposure metric</div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Breakdown Chart */}
        <div className="cyber-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
            <h3 className="text-sm font-bold text-[#F5F3FF]">Vulnerability Severity Breakdown</h3>
            <span className="text-xs text-[#A8A3B8]">{stats.total_vulns} Total Findings</span>
          </div>

          <div className="h-56 flex items-center justify-center my-2">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121022', borderColor: '#7C3AED', borderRadius: '0.5rem', color: '#F5F3FF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#A8A3B8] italic">No active vulnerabilities</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#282245] text-center text-xs">
            <div className="p-1.5 rounded bg-[#18142A]">
              <div className="text-red-400 font-bold font-mono">{stats.critical_findings}</div>
              <div className="text-[10px] text-[#A8A3B8]">Critical</div>
            </div>
            <div className="p-1.5 rounded bg-[#18142A]">
              <div className="text-orange-400 font-bold font-mono">{stats.high_findings}</div>
              <div className="text-[10px] text-[#A8A3B8]">High</div>
            </div>
            <div className="p-1.5 rounded bg-[#18142A]">
              <div className="text-amber-400 font-bold font-mono">{stats.medium_findings}</div>
              <div className="text-[10px] text-[#A8A3B8]">Medium</div>
            </div>
          </div>
        </div>

        {/* Top Exposed Services */}
        <div className="cyber-panel p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
            <h3 className="text-sm font-bold text-[#F5F3FF]">Top Exposed Network Services</h3>
            <span className="text-xs text-[#A8A3B8]">Port Density Analysis</span>
          </div>

          <div className="h-64 my-2">
            {stats.top_exposed_services?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_exposed_services} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#A8A3B8" fontSize={11} />
                  <YAxis stroke="#A8A3B8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121022', borderColor: '#7C3AED', borderRadius: '0.5rem', color: '#F5F3FF' }}
                  />
                  <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#A8A3B8] italic">
                No service data available
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#A8A3B8] flex items-center justify-between pt-2 border-t border-[#282245]">
            <span>Identified via Nmap banner detection & HTTP inspection</span>
            <button onClick={() => onNavigate('services')} className="text-[#9B5CFF] hover:underline">
              View all services →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Most Vulnerable Hosts & Recent Discoveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Vulnerable Hosts */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
            <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Most Vulnerable Hosts
            </h3>
            <button onClick={() => onNavigate('hosts')} className="text-xs text-[#9B5CFF] hover:underline">
              View All ({stats.hosts_discovered})
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {stats.most_vulnerable_hosts?.map((h) => (
              <div
                key={h.id}
                onClick={() => onNavigate('hosts', h.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#18142A] hover:bg-[#282245] border border-[#282245] hover:border-[#7C3AED]/50 cursor-pointer transition-all"
              >
                <div>
                  <div className="text-sm font-mono font-bold text-[#F5F3FF] flex items-center gap-2">
                    <span>{h.ip}</span>
                    <span className="text-xs font-normal text-[#A8A3B8] truncate max-w-[140px]">{h.hostname || '—'}</span>
                  </div>
                  <div className="text-[11px] text-[#A8A3B8] mt-0.5">
                    {h.open_ports} Open Ports • {h.findings_count} Findings
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiskGauge score={h.risk_score} level={h.risk_level} size="sm" />
                  <ArrowUpRight className="w-4 h-4 text-[#A8A3B8]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Discoveries Feed */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#282245]">
            <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9B5CFF]" /> Recent Host Discoveries
            </h3>
            <button onClick={() => onNavigate('discovery')} className="text-xs text-[#9B5CFF] hover:underline">
              New Scan
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {stats.recent_discoveries?.map((d) => (
              <div
                key={d.id}
                onClick={() => onNavigate('hosts', d.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#18142A] hover:bg-[#282245] border border-[#282245] cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#121022] border border-[#282245] flex items-center justify-center text-[#9B5CFF]">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold text-[#F5F3FF]">{d.ip}</div>
                    <div className="text-[11px] text-[#A8A3B8]">{d.os_name || d.hostname || 'Identified host'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 uppercase font-mono">
                    {d.status}
                  </span>
                  <div className="text-[10px] text-[#A8A3B8] mt-1 font-mono">{new Date(d.first_seen).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

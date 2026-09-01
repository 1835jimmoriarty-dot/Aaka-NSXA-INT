import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { Finding } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ShieldAlert, Search, Filter, ShieldCheck, ExternalLink } from 'lucide-react';

export const VulnerabilitiesPage: React.FC = () => {
  const { activeProject } = useProject();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedProof, setSelectedProof] = useState<Finding | null>(null);

  const loadFindings = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const data = await api.getFindings(activeProject.id, {
        search: search || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      });
      setFindings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [activeProject, severityFilter]);

  if (loading && findings.length === 0) return <LoadingSpinner text="Compiling vulnerability intelligence..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Vulnerabilities & Findings</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Correlated CVE disclosures, configuration misconfigurations, and exploit intel</p>
        </div>
      </div>

      <div className="cyber-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A8A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Finding title, CVE-ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#A8A3B8]" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#080611] border border-[#282245] rounded-xl text-xs text-[#F5F3FF] py-1.5 px-3 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {findings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Security Findings"
          description="No vulnerabilities or misconfigurations match your active filter."
        />
      ) : (
        <div className="cyber-panel overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#282245] bg-[#0D0A19] text-[#A8A3B8] uppercase text-[10px] tracking-wider">
                <th className="p-4 font-semibold">Finding Title</th>
                <th className="p-4 font-semibold">CVE ID</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">CVSS</th>
                <th className="p-4 font-semibold">Confidence</th>
                <th className="p-4 font-semibold">Source Tool</th>
                <th className="p-4 font-semibold text-right">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282245]">
              {findings.map((f) => (
                <tr key={f.id} className="hover:bg-[#18142A] transition-colors">
                  <td className="p-4 font-semibold text-[#F5F3FF] max-w-xs truncate">{f.title}</td>
                  <td className="p-4 font-mono text-[#9B5CFF] font-bold">{f.cve_id || '—'}</td>
                  <td className="p-4">
                    <SeverityBadge severity={f.severity} size="sm" />
                  </td>
                  <td className="p-4 font-mono font-bold text-[#F5F3FF]">{f.cvss_score}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold ${f.confidence === 'CONFIRMED' ? 'text-red-400' : 'text-amber-400'}`}>
                      {f.confidence}
                    </span>
                  </td>
                  <td className="p-4 text-[#A8A3B8] font-mono text-[11px]">{f.source_tool}</td>
                  <td className="p-4 text-right">
                    {f.evidence ? (
                      <button
                        onClick={() => setSelectedProof(f)}
                        className="text-[#9B5CFF] hover:underline font-medium text-xs"
                      >
                        Evidence
                      </button>
                    ) : (
                      <span className="text-[#A8A3B8]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">{selectedProof.title}</h3>
            <div className="text-xs text-[#A8A3B8] mb-3">{selectedProof.cve_id} • {selectedProof.source_tool}</div>
            <div className="p-3.5 rounded-xl bg-[#080611] border border-[#282245] font-mono text-xs text-[#F5F3FF] max-h-60 overflow-y-auto whitespace-pre-wrap">
              {selectedProof.evidence}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold"
              >
                Close Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

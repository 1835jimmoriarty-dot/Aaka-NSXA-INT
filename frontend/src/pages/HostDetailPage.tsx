import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { HostDetail } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskGauge } from '../components/common/RiskGauge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Server, ArrowLeft, Network, ShieldAlert, Cpu } from 'lucide-react';

export const HostDetailPage: React.FC<{ hostId: number; onBack: () => void }> = ({ hostId, onBack }) => {
  const [host, setHost] = useState<HostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<{ title: string; evidence: string } | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getHost(hostId);
        setHost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [hostId]);

  if (loading || !host) return <LoadingSpinner text="Compiling detailed host intelligence..." />;

  const openPorts = host.ports.filter((p) => p.state === 'open');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#A8A3B8] hover:text-[#F5F3FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Host Inventory</span>
        </button>

        <div className="flex items-center gap-3">
          <RiskGauge score={host.risk_score} level={host.risk_level} factorsJson={host.risk_factors_json} />
        </div>
      </div>

      <div className="cyber-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#9B5CFF] flex items-center justify-center text-white shadow-glow-purple shrink-0">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold font-mono text-[#F5F3FF]">{host.ip}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-400 uppercase">
                  {host.status}
                </span>
              </div>
              <div className="text-xs text-[#A8A3B8] mt-1 flex items-center gap-3">
                <span>Hostname: <b className="text-[#F5F3FF]">{host.hostname || '—'}</b></span>
                <span>•</span>
                <span>OS: <b className="text-[#F5F3FF]">{host.os_name || 'Generic Host'}</b></span>
                {host.mac_address && (
                  <>
                    <span>•</span>
                    <span>MAC: <b className="text-[#F5F3FF] font-mono">{host.mac_address}</b></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-[#A8A3B8]">
            <div>First Discovered: <b className="text-[#F5F3FF] font-mono">{new Date(host.first_seen).toLocaleDateString()}</b></div>
            <div>Last Scanned: <b className="text-[#F5F3FF] font-mono">{new Date(host.last_scanned).toLocaleTimeString()}</b></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <div className="cyber-panel p-5">
            <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2 pb-3 border-b border-[#282245] mb-3">
              <Network className="w-4 h-4 text-[#9B5CFF]" /> Discovered Ports ({openPorts.length})
            </h3>
            <div className="space-y-2">
              {openPorts.length === 0 ? (
                <div className="text-xs text-[#A8A3B8] italic">No open ports detected</div>
              ) : (
                openPorts.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#18142A] border border-[#282245]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#F5F3FF]">
                        {p.port_number} <span className="text-xs text-[#A8A3B8] font-normal uppercase">/{p.protocol}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-mono uppercase">
                        {p.state}
                      </span>
                    </div>
                    <div className="text-xs text-[#9B5CFF] font-semibold mt-1">{p.service_name || 'unknown service'}</div>
                    {(p.service_product || p.service_version) && (
                      <div className="text-[11px] text-[#A8A3B8] mt-0.5">
                        {p.service_product} {p.service_version}
                      </div>
                    )}
                    {p.service_cpe && (
                      <div className="text-[10px] text-[#A8A3B8]/60 font-mono mt-1 truncate">
                        {p.service_cpe}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cyber-panel p-5">
            <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2 pb-3 border-b border-[#282245] mb-3">
              <Cpu className="w-4 h-4 text-blue-400" /> Technologies ({host.technologies.length})
            </h3>
            <div className="space-y-2">
              {host.technologies.length === 0 ? (
                <div className="text-xs text-[#A8A3B8] italic">No web/framework fingerprints</div>
              ) : (
                host.technologies.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-[#18142A] border border-[#282245] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#F5F3FF]">{t.name}</div>
                      <div className="text-[10px] text-[#A8A3B8]">{t.category}</div>
                    </div>
                    <span className="text-[10px] text-[#9B5CFF] font-mono">{t.detected_by}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="cyber-panel p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2 pb-3 border-b border-[#282245] mb-4">
            <ShieldAlert className="w-4 h-4 text-red-400" /> Correlated Findings & Vulnerability Intelligence ({host.findings.length})
          </h3>

          {host.findings.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A8A3B8] italic">
              No vulnerabilities or misconfigurations flagged for this host.
            </div>
          ) : (
            <div className="space-y-3">
              {host.findings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-[#18142A] border border-[#282245] hover:border-[#7C3AED]/50 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F5F3FF]">{f.title}</h4>
                        {f.cve_id && (
                          <span className="px-2 py-0.5 rounded bg-[#121022] border border-[#282245] text-[11px] font-mono text-[#9B5CFF] font-bold">
                            {f.cve_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#A8A3B8] mt-0.5">
                        Source: <span className="font-mono">{f.source_tool}</span> • Confidence:{' '}
                        <span className="font-semibold text-[#F5F3FF]">{f.confidence}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#F5F3FF]">CVSS {f.cvss_score}</span>
                      <SeverityBadge severity={f.severity} size="sm" />
                    </div>
                  </div>

                  {f.evidence && (
                    <div className="pt-2 border-t border-[#282245] flex items-center justify-between text-xs">
                      <p className="text-[11px] text-[#A8A3B8] truncate max-w-lg font-mono">
                        {f.evidence}
                      </p>
                      <button
                        onClick={() => setSelectedEvidence({ title: f.title, evidence: f.evidence || '' })}
                        className="text-[#9B5CFF] hover:underline text-xs shrink-0 font-medium ml-2"
                      >
                        View Proof
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#F5F3FF] mb-2">{selectedEvidence.title}</h3>
            <div className="p-3.5 rounded-xl bg-[#080611] border border-[#282245] font-mono text-xs text-[#F5F3FF] max-h-60 overflow-y-auto whitespace-pre-wrap">
              {selectedEvidence.evidence}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
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

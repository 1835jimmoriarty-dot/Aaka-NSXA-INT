import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { Target } from '../types';
import { Crosshair, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const TargetsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawInput, setRawInput] = useState('');
  const [validationPreview, setValidationPreview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTargets = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const data = await api.getTargets(activeProject.id);
      setTargets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, [activeProject]);

  useEffect(() => {
    if (!rawInput.trim()) {
      setValidationPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.validateTargets(rawInput);
        setValidationPreview(res);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rawInput]);

  const handleAddTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !rawInput.trim()) return;
    try {
      setSubmitting(true);
      await api.addTargets({ project_id: activeProject.id, raw_input: rawInput });
      setRawInput('');
      setValidationPreview(null);
      await loadTargets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteTarget(id);
    await loadTargets();
  };

  if (loading && targets.length === 0) return <LoadingSpinner text="Loading target inventory..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Target Management</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Specify and validate IPv4, IPv6, CIDR blocks, hostnames, and bulk ranges</p>
        </div>
        <button
          onClick={() => onNavigate('discovery')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
        >
          <Crosshair className="w-4 h-4" />
          <span>Launch Scan on Scope</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cyber-panel p-6">
          <h3 className="text-sm font-bold text-[#F5F3FF] flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4 text-[#9B5CFF]" /> Add Targets to Scope
          </h3>
          <p className="text-xs text-[#A8A3B8] mb-4">
            Enter IP addresses (e.g. <code>127.0.0.1</code>), CIDR blocks (<code>192.168.1.0/24</code>), or domains.
          </p>

          <form onSubmit={handleAddTargets} className="space-y-4">
            <div>
              <textarea
                rows={5}
                required
                placeholder="127.0.0.1&#10;192.168.1.0/24&#10;scanme.nmap.org"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#080611] border border-[#282245] text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {validationPreview && (
              <div className="p-3 rounded-xl bg-[#18142A] border border-[#282245] space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[#A8A3B8]">Validation Preview:</span>
                  <span className={validationPreview.valid ? 'text-emerald-400' : 'text-amber-400'}>
                    {validationPreview.valid_count} Valid • {validationPreview.invalid_count} Invalid
                  </span>
                </div>

                {validationPreview.invalid_targets?.length > 0 && (
                  <div className="text-rose-400 text-[11px] space-y-1">
                    {validationPreview.invalid_targets.map((inv: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>"{inv.input}": {inv.error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-[#A8A3B8] pt-1 border-t border-[#282245]">
                  Estimated host count in scope: <span className="font-mono text-[#F5F3FF] font-bold">{validationPreview.total_estimated_hosts}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (validationPreview && validationPreview.valid_count === 0)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all disabled:opacity-50"
            >
              {submitting ? 'Adding Targets...' : 'Add Targets to Scope'}
            </button>
          </form>
        </div>

        <div className="cyber-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#282245] mb-4">
            <h3 className="text-sm font-bold text-[#F5F3FF]">Configured Target Inventory</h3>
            <span className="text-xs text-[#A8A3B8]">{targets.length} Scope Items</span>
          </div>

          {targets.length === 0 ? (
            <EmptyState
              icon={Crosshair}
              title="No Targets Configured"
              description="Add target IPs or network ranges on the left to initialize your assessment scope."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282245] text-[#A8A3B8] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Target Specification</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Est. Hosts</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282245]">
                  {targets.map((t) => (
                    <tr key={t.id} className="hover:bg-[#18142A] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#F5F3FF]">
                        {t.original_input}
                        {t.resolved_ip && <div className="text-[10px] text-[#A8A3B8] font-normal">Resolves: {t.resolved_ip}</div>}
                      </td>
                      <td className="py-3 uppercase text-[11px] text-[#9B5CFF] font-mono">{t.target_type}</td>
                      <td className="py-3 font-mono text-[#F5F3FF]">{t.host_count}</td>
                      <td className="py-3">
                        {t.is_valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]" title={t.validation_error}>
                            <AlertCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 rounded-md text-[#A8A3B8] hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Remove target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

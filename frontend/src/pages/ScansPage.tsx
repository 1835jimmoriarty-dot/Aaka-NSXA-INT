import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { ScanJob } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Scan, Radio, XCircle, Terminal } from 'lucide-react';

export const ScansPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScans = async () => {
    if (!activeProject) return;
    try {
      const data = await api.getScans(activeProject.id);
      setScans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
    const interval = setInterval(loadScans, 3000);
    return () => clearInterval(interval);
  }, [activeProject]);

  const handleCancel = async (id: number) => {
    await api.cancelScan(id);
    await loadScans();
  };

  if (loading && scans.length === 0) return <LoadingSpinner text="Loading scan execution history..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Scan History & Tasks</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Asynchronous scan orchestration records and live stage trackers</p>
        </div>
        <button
          onClick={() => onNavigate('discovery')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
        >
          <Radio className="w-4 h-4" />
          <span>Launch New Scan</span>
        </button>
      </div>

      {scans.length === 0 ? (
        <EmptyState
          icon={Scan}
          title="No Scans Executed"
          description="No scans have been launched in this project scope yet. Configure a profile and launch an assessment."
          actionText="Go to Launchpad"
          onAction={() => onNavigate('discovery')}
        />
      ) : (
        <div className="space-y-4">
          {scans.map((job) => {
            const isRunning = job.status === 'RUNNING' || job.status === 'QUEUED';
            return (
              <div key={job.id} className="cyber-panel p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#18142A] border border-[#282245] text-[#9B5CFF]">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#F5F3FF]">{job.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#18142A] text-[#A8A3B8] font-mono uppercase">
                          {job.profile}
                        </span>
                      </div>
                      <div className="text-xs text-[#A8A3B8] font-mono mt-0.5">Target: {job.target_spec}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    {isRunning && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1 hover:bg-rose-900 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#A8A3B8]">Stage: <span className="text-[#F5F3FF] font-medium">{job.current_stage}</span></span>
                    <span className="text-[#9B5CFF] font-mono font-bold">{Math.round(job.progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18142A] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7C3AED] to-[#9B5CFF] transition-all duration-300 rounded-full"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#A8A3B8] pt-3 border-t border-[#282245]">
                  <div className="flex items-center gap-4">
                    <span>Started: {job.started_at ? new Date(job.started_at).toLocaleTimeString() : 'Queued'}</span>
                    <span>Duration: {job.duration_seconds ? `${job.duration_seconds.toFixed(1)}s` : '—'}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="flex items-center gap-1 text-[#9B5CFF] hover:underline text-xs"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>View Task Logs</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

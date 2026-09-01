import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useScan } from '../context/ScanContext';
import { api } from '../api/client';
import { Task } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LiveTerminal } from '../components/common/LiveTerminal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Terminal, Copy } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { activeProject } = useProject();
  const { liveTerminalLogs } = useScan();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    if (!activeProject) return;
    try {
      const data = await api.getTasks(activeProject.id);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000);
    return () => clearInterval(interval);
  }, [activeProject]);

  if (loading && tasks.length === 0) return <LoadingSpinner text="Connecting to task execution console..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Task Execution Console</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Real-time subprocess executor logs, return codes, and process stdout streams</p>
        </div>
      </div>

      <LiveTerminal logs={liveTerminalLogs} title="Active WebSocket Stdout Stream" />

      {/* Historical Tasks Table */}
      <div className="cyber-panel p-6">
        <h3 className="text-sm font-bold text-[#F5F3FF] mb-4">Task Execution Archive</h3>
        {tasks.length === 0 ? (
          <EmptyState
            icon={Terminal}
            title="No Subprocess Tasks"
            description="Tasks are created when reconnaissance scans and staged analyzers execute."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282245] bg-[#0D0A19] text-[#A8A3B8] uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-semibold">Tool</th>
                  <th className="p-3 font-semibold">Target</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Duration</th>
                  <th className="p-3 font-semibold">Exit Code</th>
                  <th className="p-3 font-semibold text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282245]">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[#18142A] transition-colors">
                    <td className="p-3 font-bold text-[#F5F3FF]">{t.tool_name}</td>
                    <td className="p-3 font-mono text-[#9B5CFF]">{t.target}</td>
                    <td className="p-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="p-3 font-mono text-[#A8A3B8]">{t.duration_seconds.toFixed(1)}s</td>
                    <td className="p-3 font-mono text-[#A8A3B8]">{t.return_code !== null ? t.return_code : '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="text-xs text-[#9B5CFF] hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#F5F3FF] mb-1">{selectedTask.tool_name} Execution Output</h3>
            <div className="p-2.5 rounded bg-[#080611] font-mono text-xs text-[#9B5CFF] mb-3 border border-[#282245]">
              {selectedTask.command_line}
            </div>
            <div className="p-4 rounded-xl bg-[#080611] border border-[#282245] font-mono text-xs text-[#F5F3FF] max-h-80 overflow-y-auto whitespace-pre-wrap">
              {selectedTask.stdout_log || selectedTask.stderr_log || 'No output recorded.'}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold"
              >
                Close Output
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

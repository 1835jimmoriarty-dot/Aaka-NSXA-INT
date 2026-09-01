import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { ScrollText, Search, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const LogsPage: React.FC = () => {
  const { activeProject } = useProject();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      const data = await api.getLogs(activeProject?.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, [activeProject]);

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Structured Platform Logs</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Application event stream, subprocess telemetry, and error traces</p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-[#121022] hover:bg-[#18142A] border border-[#282245] text-[#A8A3B8] hover:text-[#F5F3FF]"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="cyber-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A8A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search log messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-[#080611] border border-[#282245] rounded-xl text-xs text-[#F5F3FF] py-1.5 px-3 focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      <div className="cyber-panel p-4 h-[550px] overflow-y-auto font-mono text-xs space-y-1.5 bg-[#080611]">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-[#A8A3B8] py-12 italic">No log entries located.</div>
        ) : (
          filteredLogs.map((l, i) => {
            const isErr = l.level === 'ERROR';
            const isWarn = l.level === 'WARNING';
            return (
              <div key={i} className="flex items-start gap-3 leading-relaxed hover:bg-[#121022] p-1 rounded">
                <span className="text-[#A8A3B8]/60 shrink-0 text-[11px]">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                    isErr ? 'bg-red-950 text-red-400' : isWarn ? 'bg-amber-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {l.level}
                </span>
                <span className="text-[#9B5CFF] shrink-0">[{l.module}]</span>
                <span className={`break-all ${isErr ? 'text-red-400 font-semibold' : 'text-[#F5F3FF]'}`}>
                  {l.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

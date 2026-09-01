import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Trash2, ArrowDown } from 'lucide-react';

interface LiveTerminalProps {
  logs: Array<{ line: string; timestamp?: string; taskId?: number }>;
  title?: string;
  autoScroll?: boolean;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ logs, title = 'Live Task Execution Terminal', autoScroll = true }) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map((l) => `${l.timestamp ? `[${l.timestamp}] ` : ''}${l.line}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = filter ? logs.filter((l) => l.line.toLowerCase().includes(filter.toLowerCase())) : logs;

  return (
    <div className="rounded-xl border border-[#282245] bg-[#080611] overflow-hidden flex flex-col font-mono text-xs shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D0A19] border-b border-[#282245]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#9B5CFF]" />
          <span className="font-semibold text-[#F5F3FF] tracking-wide">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18142A] text-[#A8A3B8] border border-[#282245]">
            {filteredLogs.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter output..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2.5 py-1 bg-[#121022] border border-[#282245] rounded-md text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
          />
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF] transition-colors"
            title="Copy terminal buffer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 h-80 overflow-y-auto space-y-1 select-text bg-[#080611]">
        {filteredLogs.length === 0 ? (
          <div className="text-[#A8A3B8]/60 italic py-10 text-center">
            Waiting for tool output stream...
          </div>
        ) : (
          filteredLogs.map((item, idx) => {
            const isError = item.line.toLowerCase().includes('error') || item.line.toLowerCase().includes('failed');
            const isWarning = item.line.toLowerCase().includes('warn');
            const isSuccess = item.line.toLowerCase().includes('open') || item.line.toLowerCase().includes('up') || item.line.toLowerCase().includes('done');
            const isVuln = item.line.toLowerCase().includes('vulnerable') || item.line.toLowerCase().includes('cve-');

            let textColor = 'text-[#F5F3FF]';
            if (isVuln) textColor = 'text-red-400 font-bold';
            else if (isError) textColor = 'text-rose-400';
            else if (isWarning) textColor = 'text-amber-400';
            else if (isSuccess) textColor = 'text-emerald-400';

            return (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                {item.timestamp && <span className="text-[#A8A3B8]/50 shrink-0 select-none">[{item.timestamp}]</span>}
                <span className={`break-all ${textColor}`}>{item.line}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

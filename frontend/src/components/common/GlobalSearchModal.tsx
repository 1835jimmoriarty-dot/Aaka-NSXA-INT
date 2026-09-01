import React, { useState, useEffect } from 'react';
import { Search, X, Server, Shield, Cpu, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { SearchResponse, SearchResultItem } from '../../types';
import { SeverityBadge } from './SeverityBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  projectId?: number;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate, projectId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query, projectId);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, projectId]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onNavigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center px-4 py-3.5 border-b border-[#282245] bg-[#0D0A19]">
          <Search className="w-5 h-5 text-[#9B5CFF] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search IPs, Hostnames, Ports, Services, CVEs, Technologies... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#F5F3FF] focus:outline-none placeholder-[#A8A3B8]"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#18142A] text-[#A8A3B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-xs text-[#A8A3B8] text-center py-6">Searching across security intelligence...</div>}

          {!loading && results && results.total_results === 0 && (
            <div className="text-xs text-[#A8A3B8] text-center py-6">No matching assets or findings located for "{query}".</div>
          )}

          {!loading && results && (
            <>
              {results.results_by_type.hosts?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#A8A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#9B5CFF]" /> Hosts ({results.results_by_type.hosts.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.results_by_type.hosts.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleSelect(h.url_path)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#18142A] hover:bg-[#282245] cursor-pointer border border-[#282245] hover:border-[#7C3AED]/50 transition-all"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#F5F3FF] font-mono">{h.title}</div>
                          <div className="text-xs text-[#A8A3B8]">{h.subtitle}</div>
                        </div>
                        {h.risk_level && <SeverityBadge severity={h.risk_level} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.results_by_type.findings?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#A8A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-400" /> Security Findings ({results.results_by_type.findings.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.results_by_type.findings.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelect(f.url_path)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#18142A] hover:bg-[#282245] cursor-pointer border border-[#282245] hover:border-[#7C3AED]/50 transition-all"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#F5F3FF]">{f.title}</div>
                          <div className="text-xs text-[#A8A3B8]">{f.subtitle}</div>
                        </div>
                        {f.risk_level && <SeverityBadge severity={f.risk_level} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.results_by_type.technologies?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#A8A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" /> Technologies ({results.results_by_type.technologies.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.results_by_type.technologies.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect(t.url_path)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#18142A] hover:bg-[#282245] cursor-pointer border border-[#282245] hover:border-[#7C3AED]/50 transition-all"
                      >
                        <div className="text-sm text-[#F5F3FF]">{t.title}</div>
                        <div className="text-xs text-[#A8A3B8]">{t.subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2 bg-[#0D0A19] border-t border-[#282245] flex items-center justify-between text-[11px] text-[#A8A3B8]">
          <span>Tip: Navigate using click or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};

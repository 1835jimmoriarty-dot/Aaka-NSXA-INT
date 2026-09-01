import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { Service } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Network, Search } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { activeProject } = useProject();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadServices = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const data = await api.getServices(activeProject.id, search || undefined);
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [activeProject]);

  if (loading && services.length === 0) return <LoadingSpinner text="Aggregating network services..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Services Directory</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Identified network services, products, versions, and port instances</p>
        </div>
      </div>

      <div className="cyber-panel p-4 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-[#A8A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search service name, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No Services Identified"
          description="Scan hosts to populate service names and version fingerprints."
        />
      ) : (
        <div className="cyber-panel overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#282245] bg-[#0D0A19] text-[#A8A3B8] uppercase text-[10px] tracking-wider">
                <th className="p-4 font-semibold">Service Name</th>
                <th className="p-4 font-semibold">Product Fingerprint</th>
                <th className="p-4 font-semibold">Detected Version</th>
                <th className="p-4 font-semibold">Open Instances</th>
                <th className="p-4 font-semibold">Host Count</th>
                <th className="p-4 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282245]">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-[#18142A] transition-colors">
                  <td className="p-4 font-mono font-bold text-[#9B5CFF]">{s.name}</td>
                  <td className="p-4 text-[#F5F3FF]">{s.product || '—'}</td>
                  <td className="p-4 font-mono text-[#A8A3B8]">{s.version || '—'}</td>
                  <td className="p-4 font-mono text-emerald-400 font-semibold">{s.port_count} Ports</td>
                  <td className="p-4 font-mono text-[#F5F3FF]">{s.host_count} Hosts</td>
                  <td className="p-4 text-[#A8A3B8]">{new Date(s.last_detected).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

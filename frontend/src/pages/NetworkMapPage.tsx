import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { Host } from '../types';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const NetworkMapPage: React.FC<{ onSelectHost: (id: number) => void }> = ({ onSelectHost }) => {
  const { activeProject } = useProject();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject) return;
    api.getHosts(activeProject.id).then((data) => {
      setHosts(data);
      setLoading(false);
    }).catch(console.error);
  }, [activeProject]);

  if (loading) return <LoadingSpinner text="Generating topology map..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Interactive Network Map</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Visual network topology grouped by subnets with risk-weighted node telemetry</p>
        </div>
      </div>

      <NetworkGraph hosts={hosts} onSelectHost={onSelectHost} />
    </div>
  );
};

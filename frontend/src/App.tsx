import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { ScanProvider } from './context/ScanContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TargetsPage } from './pages/TargetsPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ScansPage } from './pages/ScansPage';
import { HostsPage } from './pages/HostsPage';
import { HostDetailPage } from './pages/HostDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);

  const handleSelectHost = (id: number) => {
    setSelectedHostId(id);
    setCurrentTab('host_detail');
  };

  const renderContent = () => {
    if (currentTab === 'host_detail' && selectedHostId) {
      return <HostDetailPage hostId={selectedHostId} onBack={() => setCurrentTab('hosts')} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab, hostId) => {
          if (hostId) handleSelectHost(hostId);
          else setCurrentTab(tab);
        }} />;
      case 'projects':
        return <ProjectsPage onNavigate={setCurrentTab} />;
      case 'targets':
        return <TargetsPage onNavigate={setCurrentTab} />;
      case 'discovery':
        return <DiscoveryPage onNavigate={setCurrentTab} />;
      case 'scans':
        return <ScansPage onNavigate={setCurrentTab} />;
      case 'hosts':
        return <HostsPage onSelectHost={handleSelectHost} onNavigate={setCurrentTab} />;
      case 'services':
        return <ServicesPage />;
      case 'vulnerabilities':
        return <VulnerabilitiesPage />;
      case 'network_map':
        return <NetworkMapPage onSelectHost={handleSelectHost} />;
      case 'tasks':
        return <TasksPage />;
      case 'reports':
        return <ReportsPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <ProjectProvider>
      <ScanProvider>
        <AppLayout currentTab={currentTab} onTabChange={(tab) => {
          setSelectedHostId(null);
          setCurrentTab(tab);
        }}>
          {renderContent()}
        </AppLayout>
      </ScanProvider>
    </ProjectProvider>
  );
}

export default App;

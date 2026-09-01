import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Crosshair,
  Radio,
  Scan,
  Server,
  Network,
  ShieldAlert,
  Terminal,
  FileText,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useScan } from '../../context/ScanContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}) => {
  const { isScanning } = useScan();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'targets', label: 'Targets', icon: Crosshair },
    { id: 'discovery', label: 'Discovery & Recon', icon: Radio },
    { id: 'scans', label: 'Scans', icon: Scan, badge: isScanning ? 'LIVE' : undefined },
    { id: 'hosts', label: 'Hosts Intelligence', icon: Server },
    { id: 'services', label: 'Services', icon: Network },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert },
    { id: 'network_map', label: 'Network Map', icon: Network },
    { id: 'tasks', label: 'Task Console', icon: Terminal },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0D0A19] border-r border-[#282245] flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-[#282245] justify-between">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#9B5CFF] flex items-center justify-center text-white shrink-0 shadow-glow-purple">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="font-extrabold text-sm tracking-wider text-[#F5F3FF] uppercase font-mono">
                  AAKA-NSXA
                </div>
                <div className="text-[10px] text-[#A8A3B8] font-medium tracking-tight">
                  Intelligence Platform
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-130px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  active
                    ? 'bg-[#18142A] text-[#F5F3FF] border border-[#7C3AED]/50 shadow-glow-purple font-semibold'
                    : 'text-[#A8A3B8] hover:text-[#F5F3FF] hover:bg-[#121022]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    active ? 'text-[#9B5CFF]' : 'text-[#A8A3B8] group-hover:text-[#F5F3FF]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/60 text-purple-300 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-[#282245]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-[#121022] hover:bg-[#18142A] text-[#A8A3B8] hover:text-[#F5F3FF] border border-[#282245] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

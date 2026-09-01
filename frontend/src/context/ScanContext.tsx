import React, { createContext, useContext, useState, useEffect } from 'react';
import { wsClient } from '../api/ws';
import { ScanJob } from '../types';

interface ScanContextType {
  activeScans: Map<number, Partial<ScanJob>>;
  liveTerminalLogs: Array<{ taskId: number; line: string; timestamp: string }>;
  isScanning: boolean;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScans, setActiveScans] = useState<Map<number, Partial<ScanJob>>>(new Map());
  const [liveTerminalLogs, setLiveTerminalLogs] = useState<Array<{ taskId: number; line: string; timestamp: string }>>([]);

  useEffect(() => {
    const unsubStatus = wsClient.on('scan_status', (data) => {
      setActiveScans((prev) => {
        const next = new Map(prev);
        const scanId = data.scan_job_id;
        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          next.delete(scanId);
        } else {
          next.set(scanId, {
            id: scanId,
            status: data.status,
            progress: data.progress,
            current_stage: data.current_stage,
          });
        }
        return next;
      });
    });

    const unsubLog = wsClient.on('task_log', (data) => {
      setLiveTerminalLogs((prev) => [
        ...prev.slice(-400),
        {
          taskId: data.task_id,
          line: data.line,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    return () => {
      unsubStatus();
      unsubLog();
    };
  }, []);

  return (
    <ScanContext.Provider
      value={{
        activeScans,
        liveTerminalLogs,
        isScanning: activeScans.size > 0,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within a ScanProvider');
  return ctx;
};

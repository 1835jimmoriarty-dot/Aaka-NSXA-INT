const API_BASE = '/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errObj = await res.json();
      errorDetail = errObj.detail || errObj.message || errorDetail;
    } catch {
      errorDetail = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: (includeArchived = false) => fetchJSON<any[]>(`/projects?include_archived=${includeArchived}`),
  getProject: (id: number) => fetchJSON<any>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string }) => fetchJSON<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: any) => fetchJSON<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => fetchJSON<any>(`/projects/${id}`, { method: 'DELETE' }),
  getDashboard: (projectId: number) => fetchJSON<any>(`/projects/${projectId}/dashboard`),

  // Targets
  getTargets: (projectId: number) => fetchJSON<any[]>(`/targets?project_id=${projectId}`),
  validateTargets: (rawInput: string) => fetchJSON<any>('/targets/validate', { method: 'POST', body: JSON.stringify({ raw_input: rawInput }) }),
  addTargets: (data: { project_id: number; raw_input: string }) => fetchJSON<any[]>('/targets', { method: 'POST', body: JSON.stringify(data) }),
  deleteTarget: (id: number) => fetchJSON<any>(`/targets/${id}`, { method: 'DELETE' }),

  // Scans
  getScanProfiles: () => fetchJSON<any[]>('/scans/profiles'),
  getScans: (projectId: number) => fetchJSON<any[]>(`/scans?project_id=${projectId}`),
  getScan: (id: number) => fetchJSON<any>(`/scans/${id}`),
  launchScan: (data: any) => fetchJSON<any>('/scans', { method: 'POST', body: JSON.stringify(data) }),
  cancelScan: (id: number) => fetchJSON<any>(`/scans/${id}/cancel`, { method: 'POST' }),

  // Hosts
  getHosts: (projectId: number, params?: { status?: string; risk_level?: string; search?: string }) => {
    const q = new URLSearchParams({ project_id: String(projectId) });
    if (params?.status) q.append('status', params.status);
    if (params?.risk_level) q.append('risk_level', params.risk_level);
    if (params?.search) q.append('search', params.search);
    return fetchJSON<any[]>(`/hosts?${q.toString()}`);
  },
  getHost: (id: number) => fetchJSON<any>(`/hosts/${id}`),
  deleteHost: (id: number) => fetchJSON<any>(`/hosts/${id}`, { method: 'DELETE' }),

  // Services
  getServices: (projectId: number, search?: string) => {
    const q = new URLSearchParams({ project_id: String(projectId) });
    if (search) q.append('search', search);
    return fetchJSON<any[]>(`/services?${q.toString()}`);
  },

  // Vulnerabilities & Findings
  getFindings: (projectId: number, params?: { severity?: string; confidence?: string; host_id?: number; search?: string }) => {
    const q = new URLSearchParams({ project_id: String(projectId) });
    if (params?.severity) q.append('severity', params.severity);
    if (params?.confidence) q.append('confidence', params.confidence);
    if (params?.host_id) q.append('host_id', String(params.host_id));
    if (params?.search) q.append('search', params.search);
    return fetchJSON<any[]>(`/vulnerabilities?${q.toString()}`);
  },
  getFinding: (id: number) => fetchJSON<any>(`/vulnerabilities/${id}`),

  // Tasks
  getTasks: (projectId: number, scanJobId?: number) => {
    const q = new URLSearchParams({ project_id: String(projectId) });
    if (scanJobId) q.append('scan_job_id', String(scanJobId));
    return fetchJSON<any[]>(`/tasks?${q.toString()}`);
  },

  // Global Search
  search: (query: string, projectId?: number) => {
    const q = new URLSearchParams({ q: query });
    if (projectId) q.append('project_id', String(projectId));
    return fetchJSON<any>(`/search?${q.toString()}`);
  },

  // Health & Settings
  getHealth: () => fetchJSON<any>('/health'),
  getLicenses: () => fetchJSON<any[]>('/settings/licenses'),
  getConfig: () => fetchJSON<any>('/settings/config'),
  getLogs: (projectId?: number, limit = 200) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (projectId) q.append('project_id', String(projectId));
    return fetchJSON<any[]>(`/logs?${q.toString()}`);
  },

  // Reports Export URLs
  getReportPdfUrl: (projectId: number) => `/api/v1/reports/${projectId}/pdf`,
  getReportJsonUrl: (projectId: number) => `/api/v1/reports/${projectId}/json`,
  getReportFindingsCsvUrl: (projectId: number) => `/api/v1/reports/${projectId}/csv/findings`,
  getReportHostsCsvUrl: (projectId: number) => `/api/v1/reports/${projectId}/csv/hosts`,
};

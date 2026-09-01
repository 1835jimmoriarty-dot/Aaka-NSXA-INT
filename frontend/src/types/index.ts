export interface Project {
  id: number;
  name: string;
  description?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  host_count: number;
  port_count: number;
  vuln_count: number;
  avg_risk_score: number;
}

export interface Target {
  id: number;
  project_id: number;
  original_input: string;
  target_type: string;
  normalized: string;
  resolved_ip?: string;
  host_count: number;
  is_valid: boolean;
  validation_error?: string;
  created_at: string;
}

export interface Port {
  id: number;
  host_id: number;
  port_number: number;
  protocol: string;
  state: string;
  service_name?: string;
  service_product?: string;
  service_version?: string;
  service_extrainfo?: string;
  service_cpe?: string;
  script_output_json?: string;
  risk_level: string;
  created_at: string;
}

export interface Technology {
  id: number;
  host_id: number;
  name: string;
  category: string;
  version?: string;
  confidence: number;
  detected_by: string;
  created_at: string;
}

export interface Finding {
  id: number;
  project_id: number;
  host_id: number;
  port_id?: number;
  vulnerability_id?: number;
  title: string;
  cve_id?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  cvss_score: number;
  confidence: 'CONFIRMED' | 'POTENTIAL' | 'EXPLOIT_AVAILABLE';
  evidence?: string;
  source_tool: string;
  status: string;
  first_seen: string;
  last_seen: string;
}

export interface Host {
  id: number;
  project_id: number;
  target_id?: number;
  ip: string;
  ipv6?: string;
  hostname?: string;
  domain?: string;
  status: string;
  mac_address?: string;
  mac_vendor?: string;
  os_name?: string;
  os_family?: string;
  os_accuracy?: number;
  os_cpe?: string;
  risk_score: number;
  risk_level: string;
  risk_factors_json?: string;
  first_seen: string;
  last_scanned: string;
  open_port_count: number;
  vuln_count: number;
}

export interface HostDetail extends Host {
  ports: Port[];
  technologies: Technology[];
  findings: Finding[];
}

export interface Service {
  id: number;
  project_id: number;
  name: string;
  product?: string;
  version?: string;
  port_count: number;
  host_count: number;
  risk_level: string;
  last_detected: string;
}

export interface Task {
  id: number;
  scan_job_id: number;
  project_id: number;
  tool_name: string;
  target: string;
  command_line: string;
  status: string;
  progress: number;
  stdout_log?: string;
  stderr_log?: string;
  return_code?: number;
  start_time?: string;
  end_time?: string;
  duration_seconds: number;
  created_at: string;
}

export interface ScanJob {
  id: number;
  project_id: number;
  name: string;
  profile: string;
  target_spec: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  current_stage: string;
  raw_arguments?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds: number;
  created_at: string;
  tasks?: Task[];
}

export interface DashboardStats {
  total_assets: number;
  hosts_discovered: number;
  hosts_online: number;
  open_ports_count: number;
  total_services: number;
  total_vulns: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  info_findings: number;
  overall_risk_score: number;
  risk_level: string;
  active_scans_count: number;
  recent_discoveries: Array<{
    id: number;
    ip: string;
    hostname?: string;
    os_name?: string;
    first_seen: string;
    status: string;
  }>;
  top_exposed_services: Array<{
    name: string;
    count: number;
  }>;
  most_vulnerable_hosts: Array<{
    id: number;
    ip: string;
    hostname?: string;
    risk_score: number;
    risk_level: string;
    open_ports: number;
    findings_count: number;
  }>;
  severity_distribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFORMATIONAL: number;
  };
}

export interface ToolHealth {
  name: string;
  binary: string;
  installed: boolean;
  version?: string;
  path?: string;
  description: string;
  status: 'OPERATIONAL' | 'UNAVAILABLE' | 'DEGRADED';
  install_guidance?: string;
}

export interface SystemHealth {
  status: string;
  backend_status: string;
  database_status: string;
  nmap_status: string;
  executor_status: string;
  websocket_status: string;
  tools: ToolHealth[];
  active_scans: number;
  database_size_bytes: number;
  uptime_seconds: number;
}

export interface SearchResultItem {
  type: string;
  title: string;
  subtitle?: string;
  id: number;
  project_id?: number;
  risk_level?: string;
  url_path: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results_by_type: Record<string, SearchResultItem[]>;
}

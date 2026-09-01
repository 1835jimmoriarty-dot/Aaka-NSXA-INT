from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Base schemas
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_archived: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    host_count: int = 0
    port_count: int = 0
    vuln_count: int = 0
    avg_risk_score: float = 0.0

    class Config:
        from_attributes = True

# Target schemas
class TargetCreate(BaseModel):
    project_id: int
    raw_input: str

class TargetResponse(BaseModel):
    id: int
    project_id: int
    original_input: str
    target_type: str
    normalized: str
    resolved_ip: Optional[str] = None
    host_count: int
    is_valid: bool
    validation_error: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Port schemas
class PortResponse(BaseModel):
    id: int
    host_id: int
    port_number: int
    protocol: str
    state: str
    service_name: Optional[str] = None
    service_product: Optional[str] = None
    service_version: Optional[str] = None
    service_extrainfo: Optional[str] = None
    service_cpe: Optional[str] = None
    script_output_json: Optional[str] = "{}"
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True

# Technology schemas
class TechnologyResponse(BaseModel):
    id: int
    host_id: int
    name: str
    category: str
    version: Optional[str] = None
    confidence: float
    detected_by: str
    created_at: datetime

    class Config:
        from_attributes = True

# Finding / Vulnerability schemas
class FindingResponse(BaseModel):
    id: int
    project_id: int
    host_id: int
    port_id: Optional[int] = None
    vulnerability_id: Optional[int] = None
    title: str
    cve_id: Optional[str] = None
    severity: str
    cvss_score: float
    confidence: str
    evidence: Optional[str] = None
    source_tool: str
    status: str
    first_seen: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

# Host schemas
class HostResponse(BaseModel):
    id: int
    project_id: int
    target_id: Optional[int] = None
    ip: str
    ipv6: Optional[str] = None
    hostname: Optional[str] = None
    domain: Optional[str] = None
    status: str
    mac_address: Optional[str] = None
    mac_vendor: Optional[str] = None
    os_name: Optional[str] = None
    os_family: Optional[str] = None
    os_accuracy: Optional[int] = None
    os_cpe: Optional[str] = None
    risk_score: float
    risk_level: str
    risk_factors_json: Optional[str] = "[]"
    first_seen: datetime
    last_scanned: datetime
    open_port_count: int = 0
    vuln_count: int = 0

    class Config:
        from_attributes = True

class HostDetailResponse(HostResponse):
    ports: List[PortResponse] = []
    technologies: List[TechnologyResponse] = []
    findings: List[FindingResponse] = []

# Service schemas
class ServiceResponse(BaseModel):
    id: int
    project_id: int
    name: str
    product: Optional[str] = None
    version: Optional[str] = None
    port_count: int
    host_count: int
    risk_level: str
    last_detected: datetime

    class Config:
        from_attributes = True

# Scan and Task schemas
class ScanJobCreate(BaseModel):
    project_id: int
    name: Optional[str] = None
    profile: str = "quick" # 'quick', 'full', 'service_enum', 'vuln_discovery', 'custom'
    target_spec: str
    custom_ports: Optional[str] = None
    custom_timing: Optional[str] = "T4"
    enable_scripts: Optional[bool] = False
    custom_arguments: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    scan_job_id: int
    project_id: int
    tool_name: str
    target: str
    command_line: str
    status: str
    progress: float
    stdout_log: Optional[str] = ""
    stderr_log: Optional[str] = ""
    return_code: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class ScanJobResponse(BaseModel):
    id: int
    project_id: int
    name: str
    profile: str
    target_spec: str
    status: str
    progress: float
    current_stage: str
    raw_arguments: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: float = 0.0
    created_at: datetime
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

# Search schemas
class SearchResultItem(BaseModel):
    type: str # 'host', 'port', 'service', 'cve', 'finding', 'technology', 'project'
    title: str
    subtitle: Optional[str] = None
    id: int
    project_id: Optional[int] = None
    risk_level: Optional[str] = None
    url_path: str

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results_by_type: Dict[str, List[SearchResultItem]]

# Health and System schemas
class ToolHealth(BaseModel):
    name: str
    binary: str
    installed: bool
    version: Optional[str] = None
    path: Optional[str] = None
    description: str
    status: str # 'OPERATIONAL', 'UNAVAILABLE', 'DEGRADED'
    install_guidance: Optional[str] = None

class SystemHealthResponse(BaseModel):
    status: str # 'OPERATIONAL', 'DEGRADED', 'UNAVAILABLE'
    backend_status: str
    database_status: str
    nmap_status: str
    executor_status: str
    websocket_status: str
    tools: List[ToolHealth]
    active_scans: int
    database_size_bytes: int
    uptime_seconds: float

# Dashboard schemas
class DashboardStats(BaseModel):
    total_assets: int
    hosts_discovered: int
    hosts_online: int
    open_ports_count: int
    total_services: int
    total_vulns: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    info_findings: int
    overall_risk_score: float
    risk_level: str
    active_scans_count: int
    recent_discoveries: List[Dict[str, Any]]
    top_exposed_services: List[Dict[str, Any]]
    most_vulnerable_hosts: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]

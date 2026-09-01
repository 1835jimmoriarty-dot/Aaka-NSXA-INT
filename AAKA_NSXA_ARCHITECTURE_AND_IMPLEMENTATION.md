# AAKA-NSXA Intelligence — Architecture & Engineering Specification

## 1. System Overview

**AAKA-NSXA Intelligence** is an enterprise-grade Network Security Analytics & Intelligence Platform designed to execute authorized network reconnaissance, discover open attack surfaces, correlate vulnerability disclosures (CVEs/CPEs), orchestrate staged service enumeration, calculate transparent risk scores, and deliver multi-format audit reports.

---

## 2. Directory Hierarchy

```
aaka-nsxa-intelligence/
├── backend/
│   ├── app/
│   │   ├── adapters/
│   │   │   ├── base.py             # ToolAdapter abstract base class
│   │   │   ├── nmap_adapter.py     # Nmap reconnaissance adapter & argument builder
│   │   │   ├── ssl_adapter.py      # Native OpenSSL TLS certificate & protocol inspector
│   │   │   ├── http_adapter.py     # HTTP header & web technology analyzer
│   │   │   ├── whatweb_adapter.py  # Optional WhatWeb tool adapter
│   │   │   ├── nikto_adapter.py    # Optional Nikto vulnerability scanner adapter
│   │   │   └── registry.py         # Central tool adapter registry & health checker
│   │   ├── api/
│   │   │   ├── routes_projects.py  # Project workspace CRUD & dashboard aggregation
│   │   │   ├── routes_targets.py   # Target input parsing & live validation
│   │   │   ├── routes_scans.py     # Scan profiling & asynchronous job launching
│   │   │   ├── routes_hosts.py     # Host intelligence inventory & host detail
│   │   │   ├── routes_services.py  # Discovered services matrix
│   │   │   ├── routes_vulnerabilities.py # Security findings & CVE directory
│   │   │   ├── routes_tasks.py     # Task execution logs & status queries
│   │   │   ├── routes_reports.py   # PDF, JSON, and CSV export streaming
│   │   │   ├── routes_search.py    # Global Ctrl+K full-text search endpoint
│   │   │   ├── routes_health.py    # System telemetry & tool availability monitor
│   │   │   ├── routes_settings.py  # Platform configuration & Open Source licenses
│   │   │   ├── routes_logs.py      # In-memory structured logging buffer
│   │   │   └── websocket.py        # Real-time WebSocket connection manager
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic BaseSettings environment configuration
│   │   │   ├── database.py         # SQLAlchemy 2.0 engine & session dependency
│   │   │   ├── security.py         # Argument sanitization & injection defenses
│   │   │   └── logging.py          # Structured logging & ring buffer
│   │   ├── engine/
│   │   │   ├── target_validator.py # IPv4, IPv6, CIDR (/16-/32), Domain validators
│   │   │   ├── executor.py         # Async subprocess executor with streaming stdout
│   │   │   ├── enumeration.py      # Staged follow-up service recon engine
│   │   │   ├── cve_enrichment.py   # CPE version parser & curated CVE knowledge base
│   │   │   ├── risk_engine.py      # Explainable 0-100 deterministic risk scorer
│   │   │   └── scanner.py          # Master scan orchestrator & state machine
│   │   ├── models/                 # Normalized SQLAlchemy database models
│   │   ├── parsers/
│   │   │   └── nmap_xml_parser.py  # Nmap XML parser (ElementTree)
│   │   ├── reports/
│   │   │   ├── pdf_report.py       # ReportLab multi-page executive PDF generator
│   │   │   ├── json_report.py      # Structured JSON dump generator
│   │   │   └── csv_report.py       # Hosts and Findings CSV export generators
│   │   ├── schemas/                # Pydantic v2 schemas for request/response serialization
│   │   └── main.py                 # FastAPI application factory, CORS, and Lifespan
│   ├── tests/                      # Automated unit, integration, and E2E scan tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                    # REST API client and WebSocket client
│   │   ├── components/
│   │   │   ├── common/             # SeverityBadge, StatusBadge, RiskGauge, LiveTerminal, Search
│   │   │   ├── layout/             # Sidebar, Topbar, AppLayout
│   │   │   └── network/            # Interactive NetworkGraph topology canvas
│   │   ├── context/                # ProjectContext & ScanContext (live event bus)
│   │   ├── pages/                  # Dashboard, Projects, Targets, Discovery, Scans, Hosts, etc.
│   │   ├── types/                  # TypeScript interfaces matching backend models
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css               # Midnight Purple theme styling & glow effects
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── README.md
└── AAKA_NSXA_ARCHITECTURE_AND_IMPLEMENTATION.md
```

---

## 3. Data Flow & Execution Pipeline

```
1. Target Input & Validation
   [User Input] ──► TargetValidator ──► (Valid: IPv4/IPv6/CIDR/Domain) ──► Saved in Database

2. Scan Initialization & Subprocess Execution
   [Launch Scan] ──► ScanJob (QUEUED) ──► NmapAdapter builds safe argument array ──► SubprocessExecutor
   ──► Live stdout streamed line-by-line via WebSocket to UI terminal

3. Parsing & Entity Persistence
   Nmap XML Stream ──► NmapXmlParser ──► Extracted Hosts, Ports, OS, CPE, Scripts ──► DB Transaction

4. Staged Automated Enumeration
   Open Ports Filtered:
   - Port 80/443/8080 ──► HTTP Tech Inspector (Security headers, Web Server, Frameworks)
   - Port 443/8443     ──► TLS/SSL Analyzer (Cert expiration, weak ciphers, TLSv1.0/1.1)

5. CVE Correlation & Exploit Intelligence
   Software Version & CPE Strings ──► CVEEnrichmentEngine ──► Matched CVEs, CVSS v3, Exploit Metadata
   Classification: CONFIRMED (NSE Vuln Script match) vs POTENTIAL (Version match) vs EXPLOIT_AVAILABLE

6. Explainable Risk Calculation
   RiskEngine evaluates:
   - Vulnerability CVSS & Severity weights (Critical = up to 35 pts, High = up to 22 pts)
   - Dangerous exposed services (SMB 445, RDP 3389, Telnet 23, Redis 6379, DB ports)
   - Total attack surface (Open port density)
   ──► Output: Host Risk Score (0-100) + Explainable Factors list

7. Telemetry & Reporting
   ──► Real-time UI update across Dashboard, Hosts, Services, Vulnerabilities, Network Map
   ──► One-click PDF / JSON / CSV report generation
```

---

## 4. Subprocess Security Specifications

1. **Subprocess Isolation**: All executions use `asyncio.create_subprocess_exec(*cmd_args, stdout=PIPE, stderr=PIPE)` where `cmd_args` is an array of sanitized tokens.
2. **Command Injection Prevention**: User inputs are strictly validated against regex allowlists (`[a-zA-Z0-9.\-_/]`). Characters such as `;`, `&`, `|`, `` ` ``, `$`, `<`, `>`, `\n`, `\r` are immediately rejected.
3. **Execution Timeouts & Termination**: Every process is monitored with `asyncio.wait_for`. On timeout or user cancellation, `process.terminate()` is called, followed by `process.kill()` if necessary.

---

## 5. Adding New Tool Adapters

To integrate a new tool adapter (e.g. `Masscan`, `Nuclei`, `SSLyze`):
1. Create a new subclass of `ToolAdapter` in `backend/app/adapters/`.
2. Implement `check_availability()`, `build_command_args()`, and `parse_output()`.
3. Register the adapter instance in `backend/app/adapters/registry.py`.
4. The system will automatically monitor its health, expose it in the Settings/Health UI, and make it available for scan profiles.

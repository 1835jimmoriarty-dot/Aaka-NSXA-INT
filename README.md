# AAKA-NSXA Intelligence — Network Security Analytics & Intelligence Platform

**AAKA-NSXA Intelligence** is an enterprise-grade, browser-native Network Security Analytics, Reconnaissance Orchestration, and Vulnerability Intelligence Platform.

Modernizing and extending the automated security-assessment workflows inspired by tools like Legion, AAKA-NSXA delivers end-to-end network discovery, port auditing, OS fingerprinting, CPE/CVE correlation, staged multi-protocol enumeration, explainable risk scoring, and interactive topology graphing inside a luxury **Midnight Purple** cybersecurity UI.

---

## Key Capabilities

- **Strict Subprocess Security**: Safe CLI argument arrays via `asyncio.subprocess` (no arbitrary shell injection).
- **Primary Reconnaissance Engine**: Native Nmap integration supporting Quick Scan, Full 65k Port Scan, Service Enumeration (`-sV -sC`), Vulnerability Auditing (`--script vuln`), and Custom Scan configurations.
- **Staged Automated Enumeration**: Intelligent follow-up analysis based on discovered services (HTTP/HTTPS inspection, TLS/SSL certificate audits, SMB/SSH banner profiling).
- **CPE & CVE Correlation**: Automated Common Platform Enumeration extraction mapped to known CVE disclosures, CVSS v3 ratings, CWE classifications, and public exploit metadata.
- **Explainable Risk Scoring**: Deterministic 0–100 risk calculation with transparent score-contributing factor breakdowns.
- **Interactive Network Topology Map**: Visual network graph organized by subnets with zoom, pan, risk coloring, and host inspector drawers.
- **Real-Time Task Execution Console**: Asynchronous job queue streaming stdout/stderr line-by-line via WebSockets.
- **Multi-Format Security Reporting**: One-click generation of professional executive PDF reports (in Midnight Purple theme), structured JSON intelligence dumps, and CSV findings matrices.

---

## System Architecture

```mermaid
graph TD
    Browser[Browser / React UI (Midnight Purple Theme)] <-->|REST API & WebSockets| Backend[FastAPI Backend Server]
    Backend --> DB[(SQLAlchemy 2.0 / SQLite / PostgreSQL)]
    Backend --> Engine[Scan Orchestrator & Task Engine]
    Engine --> Validator[Target Validator: IPv4/IPv6/CIDR/Domains]
    Engine --> Adapters[Modular Tool Adapters: Nmap, SSL, HTTP, WhatWeb, Nikto]
    Adapters --> Executor[Secure Subprocess Executor]
    Executor --> Parsers[Nmap XML Parser & Output Parsers]
    Parsers --> CVE[CPE & CVE Enrichment Engine]
    CVE --> Risk[Explainable Risk Engine (0-100)]
    Risk --> DB
    Backend --> Reports[ReportLab PDF / JSON / CSV Generator]
```

---

## Quickstart & Local Installation

### Prerequisites
- **Python 3.10+** (Python 3.12 verified)
- **Node.js 18+** & npm
- **Nmap** (installed and in PATH or at configured path e.g. `D:\Nmap\nmap.exe` or `C:\Program Files (x86)\Nmap\nmap.exe`)

---

### Step 1: Install Backend Dependencies

```powershell
cd backend
python -m pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

---

### Step 3: Run the Application

#### Terminal 1 — Start the Backend API (Port 8000)
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Start the Frontend (Port 5173)
```powershell
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## Running Automated Tests

Run the backend unit, parser, CVE correlation, and end-to-end live scan test suite:

```powershell
cd backend
python -m pytest tests -v
```

Build the frontend bundle:

```powershell
cd frontend
npm run build
```

---

## Modular Tool Adapters & Availability

AAKA-NSXA features a modular Tool Adapter System. Tools configured in the environment are probed for real system availability:

| Tool Adapter | Capability | Binary Detection | Availability Status |
| :--- | :--- | :--- | :--- |
| **Nmap** | Host discovery, port scanning, OS detection, NSE scripts | `nmap` / `D:\Nmap\nmap.exe` | **OPERATIONAL** |
| **TLS/SSL Analyzer** | Certificate validity, TLS versions, cipher suite audit | Built-in Python OpenSSL engine | **OPERATIONAL** |
| **HTTP Tech Inspector**| Security headers (HSTS, CSP), server fingerprints | Built-in HTTPX engine | **OPERATIONAL** |
| **WhatWeb** | Deep web technology & CMS fingerprinting | `whatweb` | Detected / Guidance provided if missing |
| **Nikto** | Web server vulnerability & misconfiguration scanning | `nikto` | Detected / Guidance provided if missing |

*Note: If an optional external tool is missing on the host, AAKA-NSXA gracefully marks the adapter as `UNAVAILABLE` and presents exact installation instructions rather than generating synthetic mock output.*

---

## Security Boundaries & Subprocess Safety

- **No Shell Execution**: Subprocesses execute via parameter lists (`asyncio.create_subprocess_exec(*cmd_args)`). `shell=True` is strictly prohibited.
- **Strict Input Validation**: Target strings are validated against IPv4, IPv6, CIDR (/16 to /32), and FQDN specifications using strict regular expressions and `ipaddress`.
- **Resource Constraints**: Built-in timeout controls (default 30 min per scan), concurrent job limiters (default 3 concurrent scans), and graceful process cancellation tokens.
- **Authorization Notice**: Scanning operations must only be performed on networks, IP ranges, and hosts where you have explicit written authorization.

---

## Open Source Licenses & Attributions

- **Legion Framework**: Licensed under GPL-3.0. AAKA-NSXA references and modernizes core automated reconnaissance workflows.
- **Nmap**: Nmap Public Source License (NPSL) / GPL-2.0. Copyright Insecure.Com LLC.
- **FastAPI**: MIT License. Copyright (c) Sebastián Ramírez.
- **SQLAlchemy**: MIT License. Copyright (c) Michael Bayer.
- **ReportLab**: BSD License. Copyright (c) ReportLab Inc.
- **React**: MIT License. Copyright (c) Meta Platforms, Inc.
- **Tailwind CSS**: MIT License. Copyright (c) Tailwind Labs, Inc.
- **Lucide Icons**: ISC License. Copyright (c) Lucide Contributors.
- **Recharts**: MIT License. Copyright (c) Recharts Group.

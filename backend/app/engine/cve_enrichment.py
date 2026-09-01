import re
from typing import List, Dict, Any, Optional

KNOWN_CVE_DATABASE: List[Dict[str, Any]] = [
    {
        "pattern": r"(?i)apache.*(2\.4\.49|2\.4\.50)",
        "product": "Apache HTTP Server",
        "cve_id": "CVE-2021-41773",
        "title": "Apache HTTP Server Path Traversal & Remote Code Execution",
        "description": "Path traversal flaw in Apache HTTP Server 2.4.49 and 2.4.50 allowing unauthenticated remote attackers to map URLs to files outside the document root.",
        "cvss_v3": 9.8,
        "severity": "CRITICAL",
        "cwe_id": "CWE-22",
        "has_exploit": True,
        "exploit_details": "Exploit-DB: 50383; Metasploit: exploit/multi/http/apache_normalize_path"
    },
    {
        "pattern": r"(?i)openssh.*(7\.[0-7]|6\.|5\.)",
        "product": "OpenSSH",
        "cve_id": "CVE-2018-15473",
        "title": "OpenSSH User Enumeration Vulnerability",
        "description": "OpenSSH allows remote attackers to discover valid usernames via timing analysis or malformed authentication requests.",
        "cvss_v3": 5.3,
        "severity": "MEDIUM",
        "cwe_id": "CWE-200",
        "has_exploit": True,
        "exploit_details": "Exploit-DB: 45233; Multiple public PoCs available"
    },
    {
        "pattern": r"(?i)openssh.*(8\.5|8\.6|8\.7|8\.8|8\.9|9\.0|9\.1|9\.2|9\.3|9\.4|9\.5|9\.6|9\.7)p1",
        "product": "OpenSSH",
        "cve_id": "CVE-2024-6387",
        "title": "OpenSSH 'regreSSHion' Remote Code Execution in sshd",
        "description": "A signal handler race condition in OpenSSH sshd allows unauthenticated remote code execution as root on glibc-based Linux systems.",
        "cvss_v3": 8.1,
        "severity": "HIGH",
        "cwe_id": "CWE-364",
        "has_exploit": True,
        "exploit_details": "Public proof-of-concept exploits published in July 2024"
    },
    {
        "pattern": r"(?i)vsftpd.*2\.3\.4",
        "product": "vsftpd",
        "cve_id": "CVE-2011-2523",
        "title": "vsftpd 2.3.4 Backdoor Command Execution",
        "description": "vsftpd 2.3.4 contains a backdoor smiley face :) in the username allowing remote shell access on port 6200.",
        "cvss_v3": 9.8,
        "severity": "CRITICAL",
        "cwe_id": "CWE-912",
        "has_exploit": True,
        "exploit_details": "Metasploit: exploit/unix/ftp/vsftpd_234_backdoor"
    },
    {
        "pattern": r"(?i)proftpd.*1\.3\.5",
        "product": "ProFTPD",
        "cve_id": "CVE-2015-3306",
        "title": "ProFTPD 1.3.5 mod_copy Arbitrary File Copy & RCE",
        "description": "mod_copy in ProFTPD 1.3.5 allows unauthenticated remote attackers to read and write arbitrary files via the SITE CPFR and SITE CPTO commands.",
        "cvss_v3": 9.8,
        "severity": "CRITICAL",
        "cwe_id": "CWE-284",
        "has_exploit": True,
        "exploit_details": "Exploit-DB: 36742; Metasploit: exploit/unix/ftp/proftpd_modcopy_exec"
    },
    {
        "pattern": r"(?i)samba.*(3\.0\.20|3\.0\.25)",
        "product": "Samba",
        "cve_id": "CVE-2007-2447",
        "title": "Samba 'username map script' Command Execution",
        "description": "The MS-RPC functionality in Samba 3.0.20 through 3.0.25rc3 allows remote attackers to execute arbitrary commands via shell metacharacters in a username.",
        "cvss_v3": 9.8,
        "severity": "CRITICAL",
        "cwe_id": "CWE-78",
        "has_exploit": True,
        "exploit_details": "Metasploit: exploit/multi/samba/usermap_script"
    },
    {
        "pattern": r"(?i)log4j.*(2\.[0-9]\.|2\.1[0-4]\.)",
        "product": "Apache Log4j",
        "cve_id": "CVE-2021-44228",
        "title": "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
        "description": "JNDI lookup feature in Log4j2 allows remote unauthenticated attackers to execute arbitrary code via LDAP/RMI JNDI reference payloads.",
        "cvss_v3": 10.0,
        "severity": "CRITICAL",
        "cwe_id": "CWE-502",
        "has_exploit": True,
        "exploit_details": "Massively exploited in the wild; multiple automated scanners & PoCs"
    },
    {
        "pattern": r"(?i)nginx.*(1\.(1[0-7]|[0-9])\.)",
        "product": "Nginx",
        "cve_id": "CVE-2021-23017",
        "title": "Nginx DNS Resolver 1-byte Memory Overwrite",
        "description": "A 1-byte memory overwrite flaw in Nginx DNS resolver enables remote attackers to crash the worker process or execute code.",
        "cvss_v3": 7.5,
        "severity": "HIGH",
        "cwe_id": "CWE-193",
        "has_exploit": False,
        "exploit_details": None
    },
    {
        "pattern": r"(?i)microsoft.*smb|smb.*v1",
        "product": "Microsoft Windows SMB",
        "cve_id": "CVE-2017-0144",
        "title": "Microsoft Windows SMB Remote Code Execution (EternalBlue / MS17-010)",
        "description": "A remote code execution vulnerability exists in Microsoft Server Message Block 1.0 (SMBv1) that allows attackers to execute arbitrary code on the target server.",
        "cvss_v3": 9.8,
        "severity": "CRITICAL",
        "cwe_id": "CWE-20",
        "has_exploit": True,
        "exploit_details": "Metasploit: exploit/windows/smb/ms17_010_eternalblue"
    }
]

class CVEEnrichmentEngine:
    @staticmethod
    def correlate_service(
        service_name: Optional[str],
        product: Optional[str],
        version: Optional[str],
        cpe: Optional[str],
        script_outputs: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        findings = []
        full_text = f"{service_name or ''} {product or ''} {version or ''} {cpe or ''}".strip()
        if not full_text:
            return findings

        # 1. Parse NSE Vuln Script Outputs directly (CONFIRMED findings)
        if script_outputs:
            for s_id, s_out in script_outputs.items():
                if "vuln" in s_id.lower() or "cve" in s_out.lower() or "VULNERABLE" in s_out:
                    cve_matches = re.findall(r"CVE-\d{4}-\d{4,7}", s_out, re.IGNORECASE)
                    cve_id = cve_matches[0].upper() if cve_matches else None
                    
                    findings.append({
                        "title": f"NSE Detection: {s_id}",
                        "cve_id": cve_id,
                        "severity": "CRITICAL" if "VULNERABLE" in s_out else "HIGH",
                        "cvss_score": 8.5 if "VULNERABLE" in s_out else 7.0,
                        "confidence": "CONFIRMED",
                        "evidence": s_out[:500],
                        "source_tool": f"nmap-nse:{s_id}",
                        "has_exploit": True if "exploit" in s_out.lower() else False,
                        "exploit_details": f"Detected by Nmap NSE script {s_id}"
                    })

        # 2. Correlate with Curated CVE Intelligence
        for cve_entry in KNOWN_CVE_DATABASE:
            if re.search(cve_entry["pattern"], full_text):
                if any(f.get("cve_id") == cve_entry["cve_id"] for f in findings):
                    continue

                confidence = "EXPLOIT_AVAILABLE" if cve_entry.get("has_exploit") else "POTENTIAL"
                findings.append({
                    "title": cve_entry["title"],
                    "cve_id": cve_entry["cve_id"],
                    "severity": cve_entry["severity"],
                    "cvss_score": cve_entry["cvss_v3"],
                    "confidence": confidence,
                    "evidence": f"Software signature '{full_text}' matches vulnerable version range for {cve_entry['product']}",
                    "source_tool": "aaka-cve-correlator",
                    "has_exploit": cve_entry["has_exploit"],
                    "exploit_details": cve_entry.get("exploit_details"),
                    "description": cve_entry["description"],
                    "cwe_id": cve_entry.get("cwe_id")
                })

        return findings

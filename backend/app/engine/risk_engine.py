from typing import List, Dict, Any, Tuple

class RiskEngine:
    DANGEROUS_PORTS = {
        445: ("SMB (Port 445) exposed — high risk file sharing and lateral movement vector", 18.0),
        139: ("NetBIOS (Port 139) exposed", 8.0),
        3389: ("RDP (Port 3389) exposed — remote desktop service", 15.0),
        23: ("Telnet (Port 23) unencrypted management protocol", 16.0),
        21: ("FTP (Port 21) cleartext file transfer", 6.0),
        5900: ("VNC (Port 5900) unencrypted remote framebuffer", 12.0),
        3306: ("MySQL database service exposed directly to network", 10.0),
        5432: ("PostgreSQL database service exposed directly to network", 10.0),
        1433: ("Microsoft SQL Server exposed directly to network", 10.0),
        6379: ("Redis in-memory database exposed directly (potential unauthenticated RCE)", 16.0),
        27017: ("MongoDB NoSQL database exposed directly to network", 14.0),
        111: ("RPCBind (Port 111) portmapper exposed", 7.0),
    }

    @classmethod
    def calculate_host_risk(
        cls,
        ports: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        is_up: bool = True
    ) -> Tuple[float, str, List[str]]:
        if not is_up:
            return (0.0, "NONE", ["Host is offline/unreachable."])

        score = 0.0
        factors: List[str] = []

        # 1. Vulnerability Findings Contribution
        for f in findings:
            sev = f.get("severity", "LOW").upper()
            cvss = f.get("cvss_score", 5.0)
            conf = f.get("confidence", "POTENTIAL")
            weight = 1.0 if conf == "CONFIRMED" or conf == "EXPLOIT_AVAILABLE" else 0.85

            if sev == "CRITICAL":
                added = round(min(35.0, cvss * 3.5 * weight), 1)
                score += added
                factors.append(f"+{added} pts: Critical Finding '{f.get('title')}' ({f.get('cve_id') or 'CVSS ' + str(cvss)})")
            elif sev == "HIGH":
                added = round(min(22.0, cvss * 2.2 * weight), 1)
                score += added
                factors.append(f"+{added} pts: High Finding '{f.get('title')}' ({f.get('cve_id') or 'CVSS ' + str(cvss)})")
            elif sev == "MEDIUM":
                added = round(min(10.0, cvss * 1.0 * weight), 1)
                score += added
                factors.append(f"+{added} pts: Medium Finding '{f.get('title')}'")
            elif sev == "LOW":
                score += 2.0

        # 2. Dangerous Ports
        for p in ports:
            port_num = p.get("port_number")
            state = p.get("state", "open")
            if state == "open" and port_num in cls.DANGEROUS_PORTS:
                desc, pts = cls.DANGEROUS_PORTS[port_num]
                score += pts
                factors.append(f"+{pts} pts: {desc}")

        # 3. Attack Surface
        open_port_count = sum(1 for p in ports if p.get("state") == "open")
        if open_port_count > 0:
            port_pts = min(10.0, open_port_count * 1.0)
            score += port_pts
            factors.append(f"+{round(port_pts, 1)} pts: Attack surface exposure ({open_port_count} open ports)")

        final_score = round(min(100.0, max(0.0, score)), 1)

        # Realistic Risk Severity Thresholds
        if final_score >= 70.0:
            level = "CRITICAL"
        elif final_score >= 50.0:
            level = "HIGH"
        elif final_score >= 25.0:
            level = "MEDIUM"
        elif final_score > 0.0:
            level = "LOW"
        else:
            level = "NONE"

        if not factors:
            factors.append("No high-risk exposures or known vulnerabilities detected.")

        return (final_score, level, factors)

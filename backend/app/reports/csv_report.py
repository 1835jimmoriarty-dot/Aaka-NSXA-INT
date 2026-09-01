import csv
import io
from typing import Dict, Any, List

class CSVReportGenerator:
    @staticmethod
    def generate_findings_csv(findings: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "Finding ID", "Host IP", "Port", "Title", "CVE ID",
            "Severity", "CVSS Score", "Confidence", "Source Tool", "Status", "Evidence"
        ])

        for f in findings:
            writer.writerow([
                f.get("id"),
                f.get("host_ip", ""),
                f.get("port_number", ""),
                f.get("title", ""),
                f.get("cve_id", ""),
                f.get("severity", ""),
                f.get("cvss_score", ""),
                f.get("confidence", ""),
                f.get("source_tool", ""),
                f.get("status", ""),
                f.get("evidence", "")
            ])

        return output.getvalue()

    @staticmethod
    def generate_hosts_csv(hosts: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Host ID", "IP Address", "Hostname", "Status", "OS Name",
            "OS Family", "MAC Address", "Vendor", "Risk Score", "Risk Level", "Open Ports"
        ])

        for h in hosts:
            open_ports = ", ".join(str(p.get("port_number")) for p in h.get("ports", []) if p.get("state") == "open")
            writer.writerow([
                h.get("id"),
                h.get("ip", ""),
                h.get("hostname", ""),
                h.get("status", ""),
                h.get("os_name", ""),
                h.get("os_family", ""),
                h.get("mac_address", ""),
                h.get("mac_vendor", ""),
                h.get("risk_score", 0.0),
                h.get("risk_level", "LOW"),
                open_ports
            ])

        return output.getvalue()

import json
from typing import List, Dict, Any
from app.adapters.registry import adapter_registry
from app.adapters.ssl_adapter import SSLAdapter
from app.adapters.http_adapter import HTTPAdapter
from app.core.logging import logger

class StagedEnumerationEngine:
    """Intelligently triggers follow-up service-specific reconnaissance based on discovered open ports."""

    @staticmethod
    async def enumerate_host_services(
        host_ip: str,
        open_ports: List[Dict[str, Any]],
        on_log: Any = None
    ) -> Dict[str, Any]:
        results = {
            "additional_findings": [],
            "additional_technologies": []
        }

        ssl_adapter: SSLAdapter = adapter_registry.get_adapter("ssl_analyzer")
        http_adapter: HTTPAdapter = adapter_registry.get_adapter("http_inspector")

        for port_info in open_ports:
            port_num = port_info.get("port_number")
            service_name = (port_info.get("service_name") or "").lower()
            state = port_info.get("state", "open")

            if state != "open":
                continue

            # 1. HTTP / HTTPS Enumeration
            is_ssl_port = port_num in [443, 8443, 9443] or "ssl" in service_name or "https" in service_name
            is_http_port = port_num in [80, 8080, 8000, 8888, 3000, 5000] or "http" in service_name or is_ssl_port

            if is_ssl_port and ssl_adapter:
                if on_log:
                    on_log(f"[*] Analyzing TLS/SSL configuration for {host_ip}:{port_num}")
                ssl_res = ssl_adapter.inspect_ssl_target(host_ip, port_num)
                if ssl_res.get("findings"):
                    for f in ssl_res["findings"]:
                        f["port_number"] = port_num
                        f["source_tool"] = "aaka-ssl-inspector"
                        results["additional_findings"].append(f)

            if is_http_port and http_adapter:
                if on_log:
                    on_log(f"[*] Inspecting HTTP security headers & web technologies for {host_ip}:{port_num}")
                http_res = http_adapter.inspect_http_target(host_ip, port_num, use_ssl=is_ssl_port)
                for tech in http_res.get("technologies", []):
                    tech["port_number"] = port_num
                    tech["detected_by"] = "aaka-http-inspector"
                    results["additional_technologies"].append(tech)

                for f in http_res.get("findings", []):
                    f["port_number"] = port_num
                    f["source_tool"] = "aaka-http-inspector"
                    results["additional_findings"].append(f)

        return results

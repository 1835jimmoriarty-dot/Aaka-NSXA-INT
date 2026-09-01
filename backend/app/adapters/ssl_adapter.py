import ssl
import socket
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.adapters.base import ToolAdapter

class SSLAdapter(ToolAdapter):
    name = "TLS/SSL Security Analyzer"
    description = "Inspects SSL/TLS certificates, cipher suites, protocol versions, and cryptographic hygiene."
    binary_name = "internal_python_ssl"
    default_timeout = 30

    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        return (True, f"OpenSSL/Python {ssl.OPENSSL_VERSION}", None)

    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        # Internal python executor
        return ["internal:ssl", target, str(options.get("port", 443))]

    def inspect_ssl_target(self, host: str, port: int = 443) -> Dict[str, Any]:
        """Performs comprehensive SSL handshake and certificate inspection."""
        result = {
            "host": host,
            "port": port,
            "connected": False,
            "tls_version": None,
            "cipher": None,
            "cert": {},
            "findings": [],
            "error": None
        }
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # For assessment of self-signed or invalid certs

        try:
            with socket.create_connection((host, port), timeout=5) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    result["connected"] = True
                    result["tls_version"] = ssock.version()
                    result["cipher"] = ssock.cipher()
                    cert = ssock.getpeercert(binary_form=False) or {}
                    result["cert"] = cert

                    # Check deprecated TLS versions
                    if result["tls_version"] in ["TLSv1", "TLSv1.1", "SSLv2", "SSLv3"]:
                        result["findings"].append({
                            "title": f"Deprecated {result['tls_version']} Protocol Supported",
                            "severity": "HIGH",
                            "cvss": 7.5,
                            "cve_id": "CVE-2015-4000",
                            "confidence": "CONFIRMED",
                            "evidence": f"Negotiated {result['tls_version']} using cipher {result['cipher']}"
                        })

                    # Check Certificate Expiration
                    if "notAfter" in cert:
                        try:
                            # format: 'May 15 12:00:00 2025 GMT'
                            expire_dt = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                            if expire_dt < datetime.utcnow():
                                result["findings"].append({
                                    "title": "SSL/TLS Certificate Expired",
                                    "severity": "HIGH",
                                    "cvss": 7.0,
                                    "confidence": "CONFIRMED",
                                    "evidence": f"Certificate expired on {cert['notAfter']}"
                                })
                        except Exception:
                            pass
        except Exception as e:
            result["error"] = str(e)

        return result

    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        return {}

import httpx
from typing import List, Dict, Any, Tuple, Optional
from app.adapters.base import ToolAdapter

class HTTPAdapter(ToolAdapter):
    name = "HTTP Technology & Header Inspector"
    description = "Analyzes web servers, response headers, cookies, security policies, and tech signatures."
    binary_name = "internal_http"
    default_timeout = 30

    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        return (True, f"HTTPX {httpx.__version__}", None)

    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        return ["internal:http", target, str(options.get("port", 80))]

    def inspect_http_target(self, host: str, port: int = 80, use_ssl: bool = False) -> Dict[str, Any]:
        proto = "https" if use_ssl else "http"
        url = f"{proto}://{host}:{port}/"
        result = {
            "url": url,
            "status_code": None,
            "server": None,
            "technologies": [],
            "findings": [],
            "headers": {},
            "error": None
        }

        try:
            with httpx.Client(verify=False, timeout=6.0, follow_redirects=True) as client:
                res = client.get(url)
                result["status_code"] = res.status_code
                result["headers"] = dict(res.headers)

                # Server header
                server = res.headers.get("server")
                if server:
                    result["server"] = server
                    result["technologies"].append({"name": server, "category": "Web Server", "confidence": 1.0})

                # X-Powered-By
                powered = res.headers.get("x-powered-by")
                if powered:
                    result["technologies"].append({"name": powered, "category": "Framework", "confidence": 1.0})

                # Missing Security Headers findings
                sec_headers = {
                    "strict-transport-security": ("Missing HSTS Header", "LOW", 3.5, "Strict-Transport-Security header is not enforced."),
                    "x-frame-options": ("Missing X-Frame-Options Header (Clickjacking)", "LOW", 4.3, "X-Frame-Options header missing, allowing potential framing/clickjacking."),
                    "x-content-type-options": ("Missing X-Content-Type-Options Header", "LOW", 3.0, "X-Content-Type-Options nosniff header missing."),
                    "content-security-policy": ("Missing Content Security Policy (CSP)", "LOW", 3.8, "Content-Security-Policy header is missing or empty.")
                }

                for header_key, (title, severity, cvss, desc) in sec_headers.items():
                    if header_key not in res.headers and (use_ssl or header_key != "strict-transport-security"):
                        result["findings"].append({
                            "title": title,
                            "severity": severity,
                            "cvss": cvss,
                            "confidence": "CONFIRMED",
                            "evidence": f"Response from {url} missing {header_key} header."
                        })

        except Exception as e:
            result["error"] = str(e)

        return result

    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        return {}

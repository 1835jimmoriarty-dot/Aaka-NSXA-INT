import os
import subprocess
from typing import List, Dict, Any, Tuple, Optional
from app.adapters.base import ToolAdapter
from app.core.config import settings

class NmapAdapter(ToolAdapter):
    name = "Nmap"
    description = "Network Mapper for host discovery, port scanning, OS detection, and NSE scripts."
    binary_name = "nmap"
    default_timeout = 1800

    def __init__(self, custom_path: Optional[str] = None):
        path = custom_path or settings.NMAP_PATH
        super().__init__(custom_path=path)

    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        bin_path = self.get_binary_path()
        if not bin_path or not os.path.exists(bin_path):
            return (
                False,
                None,
                "Nmap is not installed or not found at the configured path. Download from https://nmap.org/download.html"
            )
        try:
            res = subprocess.run([bin_path, "--version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                first_line = res.stdout.splitlines()[0] if res.stdout else "Nmap Available"
                return (True, first_line, None)
            return (False, None, f"Nmap exited with code {res.returncode}: {res.stderr}")
        except Exception as e:
            return (False, None, f"Error probing Nmap: {str(e)}")

    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        profile = options.get("profile", "quick")
        custom_ports = options.get("custom_ports")
        custom_timing = options.get("custom_timing", "T4")
        enable_scripts = options.get("enable_scripts", False)
        
        args = [self.get_binary_path()]
        
        # Timing
        if custom_timing in ["T0", "T1", "T2", "T3", "T4", "T5"]:
            args.append(f"-{custom_timing}")
        else:
            args.append("-T4")

        # Profiles
        if profile == "quick":
            args.extend(["-F", "-sV", "--version-light"])
        elif profile == "full":
            args.extend(["-p-", "-sV", "-O", "--version-all"])
        elif profile == "service_enum":
            args.extend(["-sV", "-sC", "--version-all"])
        elif profile == "vuln_discovery":
            args.extend(["-sV", "--script", "vuln and not dos"])
        elif profile == "custom":
            if custom_ports:
                args.extend(["-p", str(custom_ports)])
            else:
                args.append("-F")
            args.append("-sV")
            if enable_scripts:
                args.append("-sC")
        else:
            args.extend(["-F", "-sV"])

        # XML Output for reliable parsing
        args.extend(["-oX", "-", target])
        return args

    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        from app.parsers.nmap_xml_parser import NmapXmlParser
        return NmapXmlParser.parse_xml_string(stdout)

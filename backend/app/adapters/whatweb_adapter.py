import os
import shutil
import subprocess
from typing import List, Dict, Any, Tuple, Optional
from app.adapters.base import ToolAdapter
from app.core.config import settings

class WhatWebAdapter(ToolAdapter):
    name = "WhatWeb"
    description = "Next generation web scanner identifying websites, CMS, JavaScript libraries, and technologies."
    binary_name = "whatweb"
    default_timeout = 300

    def __init__(self, custom_path: Optional[str] = None):
        path = custom_path or settings.WHATWEB_PATH
        super().__init__(custom_path=path)

    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        bin_path = self.get_binary_path()
        if not bin_path or not shutil.which(bin_path):
            return (
                False,
                None,
                "WhatWeb is not installed. Install on Linux/WSL via 'apt-get install whatweb' or Ruby gem 'gem install whatweb'."
            )
        try:
            res = subprocess.run([bin_path, "--version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                first_line = res.stdout.splitlines()[0] if res.stdout else "WhatWeb Available"
                return (True, first_line, None)
            return (False, None, f"WhatWeb error: {res.stderr}")
        except Exception as e:
            return (False, None, str(e))

    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        return [self.get_binary_path(), "--log-json", "-", target]

    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        import json
        try:
            return {"results": json.loads(stdout)}
        except Exception:
            return {"results": [], "raw": stdout}

class NiktoAdapter(ToolAdapter):
    name = "Nikto"
    description = "Web server vulnerability scanner testing for dangerous files, outdated server software, and misconfigurations."
    binary_name = "nikto"
    default_timeout = 600

    def __init__(self, custom_path: Optional[str] = None):
        path = custom_path or settings.NIKTO_PATH
        super().__init__(custom_path=path)

    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        bin_path = self.get_binary_path()
        if not bin_path or not shutil.which(bin_path):
            return (
                False,
                None,
                "Nikto is not installed. Install via 'apt-get install nikto' or clone from https://github.com/sullo/nikto."
            )
        try:
            res = subprocess.run([bin_path, "-Version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return (True, res.stdout.strip(), None)
            return (False, None, f"Nikto error: {res.stderr}")
        except Exception as e:
            return (False, None, str(e))

    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        port = options.get("port", 80)
        return [self.get_binary_path(), "-h", target, "-p", str(port), "-Format", "json", "-output", "-"]

    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        import json
        try:
            return json.loads(stdout)
        except Exception:
            return {"raw": stdout}

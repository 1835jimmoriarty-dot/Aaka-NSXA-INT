import asyncio
import json
from .base import ToolAdapter
import shutil


class NiktoAdapter(ToolAdapter):
    """Adapter for Nikto web server vulnerability scanner."""

    def __init__(self):
        binary = shutil.which("nikto") or shutil.which("nikto.pl")
        super().__init__(
            name="Nikto",
            binary=binary or "nikto",
            description="Web server vulnerability scanner testing for dangerous files, outdated server software, and misconfigurations.",
            install_guidance="Nikto is not installed. Install via 'apt-get install nikto' on Linux/WSL or clone from https://github.com/sullo/nikto.",
        )

    def build_command_args(self, target: str, port: int = 80, ssl: bool = False) -> list:
        args = [self.binary, "-h", target, "-p", str(port), "-Format", "json", "-nointeractive"]
        if ssl:
            args.append("-ssl")
        return args

    async def scan(self, target: str, port: int = 80, ssl: bool = False) -> dict:
        if not self.installed:
            return {"status": "UNAVAILABLE", "findings": [], "error": self.install_guidance}
        try:
            cmd = self.build_command_args(target, port, ssl)
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            raw = stdout.decode(errors="replace").strip()
            try:
                data = json.loads(raw)
                return {"status": "SUCCESS", "findings": data.get("vulnerabilities", []), "raw": raw}
            except json.JSONDecodeError:
                return {"status": "SUCCESS", "findings": [], "raw": raw}
        except asyncio.TimeoutError:
            return {"status": "TIMEOUT", "findings": [], "error": "Nikto scan timed out after 120s"}
        except Exception as e:
            return {"status": "ERROR", "findings": [], "error": str(e)}

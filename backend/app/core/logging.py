import sys
import logging
from datetime import datetime
from typing import List, Dict, Any

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("aaka_nsxa")

class InMemoryLogBuffer:
    """Maintains a ring buffer of recent logs for UI streaming and query"""
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.logs: List[Dict[str, Any]] = []

    def add(self, level: str, message: str, module: str = "system", project_id: int = None, scan_id: int = None):
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "message": message,
            "module": module,
            "project_id": project_id,
            "scan_id": scan_id
        }
        self.logs.append(entry)
        if len(self.logs) > self.max_size:
            self.logs.pop(0)

    def get_logs(self, project_id: int = None, scan_id: int = None, limit: int = 200) -> List[Dict[str, Any]]:
        filtered = self.logs
        if project_id is not None:
            filtered = [l for l in filtered if l.get("project_id") == project_id or l.get("project_id") is None]
        if scan_id is not None:
            filtered = [l for l in filtered if l.get("scan_id") == scan_id]
        return filtered[-limit:]

log_buffer = InMemoryLogBuffer()

import json
from datetime import datetime
from typing import Dict, Any

class JSONReportGenerator:
    @staticmethod
    def generate_report(project_data: Dict[str, Any]) -> str:
        payload = {
            "platform": "AAKA-NSXA Intelligence — Network Security Analytics & Intelligence Platform",
            "report_format": "JSON-v1.0",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "project": project_data
        }
        return json.dumps(payload, indent=2, default=str)

from typing import Dict, List, Any
from app.adapters.base import ToolAdapter
from app.adapters.nmap_adapter import NmapAdapter
from app.adapters.ssl_adapter import SSLAdapter
from app.adapters.http_adapter import HTTPAdapter
from app.adapters.whatweb_adapter import WhatWebAdapter, NiktoAdapter

class AdapterRegistry:
    """Central registry of all security tool adapters in AAKA-NSXA."""
    
    def __init__(self):
        self._adapters: Dict[str, ToolAdapter] = {
            "nmap": NmapAdapter(),
            "ssl_analyzer": SSLAdapter(),
            "http_inspector": HTTPAdapter(),
            "whatweb": WhatWebAdapter(),
            "nikto": NiktoAdapter(),
        }

    def get_adapter(self, name: str) -> ToolAdapter:
        return self._adapters.get(name.lower())

    def get_all_adapters(self) -> Dict[str, ToolAdapter]:
        return self._adapters

    def get_health_status(self) -> List[Dict[str, Any]]:
        status_list = []
        for name, adapter in self._adapters.items():
            avail, version, guidance = adapter.check_availability()
            status_list.append({
                "name": adapter.name,
                "binary": adapter.binary_name,
                "installed": avail,
                "version": version,
                "path": adapter.get_binary_path() if avail else None,
                "description": adapter.description,
                "status": "OPERATIONAL" if avail else "UNAVAILABLE",
                "install_guidance": guidance
            })
        return status_list

adapter_registry = AdapterRegistry()

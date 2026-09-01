import shutil
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional

class ToolAdapter(ABC):
    """Abstract base class for security tools integrated into AAKA-NSXA."""
    
    name: str = ""
    description: str = ""
    binary_name: str = ""
    default_timeout: int = 600

    def __init__(self, custom_path: Optional[str] = None):
        self.custom_path = custom_path

    def get_binary_path(self) -> str:
        if self.custom_path and shutil.which(self.custom_path):
            return self.custom_path
        found = shutil.which(self.binary_name)
        if found:
            return found
        return self.custom_path or self.binary_name

    @abstractmethod
    def check_availability(self) -> Tuple[bool, Optional[str], Optional[str]]:
        """Returns (is_available, version_string, installation_guidance)"""
        pass

    @abstractmethod
    def build_command_args(self, target: str, options: Dict[str, Any]) -> List[str]:
        """Constructs safe CLI argument list (never shell string)"""
        pass

    @abstractmethod
    def parse_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        """Parses output into structured assessment data"""
        pass

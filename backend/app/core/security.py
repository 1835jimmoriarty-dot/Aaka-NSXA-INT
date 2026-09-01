import re
import ipaddress
from typing import List, Optional, Tuple

SAFE_HOSTNAME_REGEX = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-_]{1,63}(?<!-)(\.[A-Za-z0-9-_]{1,63})*$"
)
DANGEROUS_SHELL_CHARS = re.compile(r"[;&|`$<>{}\[\]\\!\n\r]")

def is_safe_input_string(value: str) -> bool:
    if not value or len(value) > 512:
        return False
    if DANGEROUS_SHELL_CHARS.search(value):
        return False
    return True

def sanitize_cli_argument(arg: str) -> str:
    """Strip or validate individual CLI argument token to ensure no shell injection"""
    if DANGEROUS_SHELL_CHARS.search(arg):
        raise ValueError(f"Dangerous characters detected in argument: {arg}")
    return arg.strip()

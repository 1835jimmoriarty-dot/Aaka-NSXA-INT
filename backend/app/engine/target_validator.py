import re
import ipaddress
from typing import List, Dict, Any, Tuple

class TargetValidator:
    """Validates IPv4, IPv6, CIDR, Hostnames, and bulk lists with strict safety checks."""

    @staticmethod
    def validate_single_target(raw_target: str) -> Dict[str, Any]:
        target = raw_target.strip()
        if not target:
            return {"valid": False, "error": "Target string is empty", "type": "unknown", "input": target}

        # Reject command injection or whitespace in single target token
        if re.search(r"[;&|`$<>{}\[\]\\!\s]", target):
            return {"valid": False, "error": "Invalid characters in target specification", "type": "invalid", "input": target}

        # 1. Check if IPv4 or IPv6 single address
        try:
            ip_obj = ipaddress.ip_address(target)
            return {
                "valid": True,
                "type": f"ipv{ip_obj.version}",
                "input": target,
                "normalized": str(ip_obj),
                "is_private": ip_obj.is_private,
                "is_loopback": ip_obj.is_loopback,
                "host_count": 1
            }
        except ValueError:
            pass

        # 2. Check if CIDR network range (e.g. 192.168.1.0/24)
        if "/" in target:
            try:
                net_obj = ipaddress.ip_network(target, strict=False)
                num_hosts = net_obj.num_addresses
                if num_hosts > 65536:
                    return {
                        "valid": False,
                        "error": f"CIDR range /{net_obj.prefixlen} is too large ({num_hosts} hosts). Maximum supported prefix is /16.",
                        "type": "cidr",
                        "input": target
                    }
                return {
                    "valid": True,
                    "type": "cidr",
                    "input": target,
                    "normalized": str(net_obj),
                    "network_address": str(net_obj.network_address),
                    "broadcast_address": str(net_obj.broadcast_address),
                    "prefixlen": net_obj.prefixlen,
                    "host_count": num_hosts
                }
            except ValueError as e:
                return {"valid": False, "error": f"Invalid CIDR notation: {str(e)}", "type": "cidr", "input": target}

        # 3. Check if valid Domain or Hostname
        domain_pattern = re.compile(r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-_]{1,63}(?<!-)(\.[A-Za-z0-9-_]{1,63})*$")
        if domain_pattern.match(target):
            return {
                "valid": True,
                "type": "domain" if "." in target else "hostname",
                "input": target,
                "normalized": target.lower(),
                "host_count": 1
            }

        return {"valid": False, "error": "Invalid format. Must be a valid IPv4, IPv6, CIDR range, or Domain name.", "type": "unknown", "input": target}

    @staticmethod
    def parse_and_validate_bulk(raw_input: str) -> Dict[str, Any]:
        """Parses newline or comma separated targets and validates each."""
        # Split on line breaks or commas
        raw_items = [item.strip() for item in re.split(r"[\r\n,]+", raw_input) if item.strip()]
        if not raw_items:
            return {"valid": False, "error": "No targets provided", "targets": [], "total_hosts": 0}

        validated_targets = []
        invalid_targets = []
        total_estimated_hosts = 0

        for item in raw_items:
            res = TargetValidator.validate_single_target(item)
            if res["valid"]:
                validated_targets.append(res)
                total_estimated_hosts += res.get("host_count", 1)
            else:
                invalid_targets.append(res)

        return {
            "valid": len(invalid_targets) == 0,
            "total_provided": len(raw_items),
            "valid_count": len(validated_targets),
            "invalid_count": len(invalid_targets),
            "valid_targets": validated_targets,
            "invalid_targets": invalid_targets,
            "total_estimated_hosts": total_estimated_hosts
        }

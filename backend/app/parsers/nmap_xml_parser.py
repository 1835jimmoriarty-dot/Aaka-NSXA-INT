import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional

class NmapXmlParser:
    """Parses standard Nmap XML output into structured Python objects."""

    @staticmethod
    def parse_xml_string(xml_content: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "hosts": [],
            "scan_info": {},
            "raw_summary": "",
            "error": None
        }

        if not xml_content or not xml_content.strip():
            result["error"] = "Empty XML output from Nmap"
            return result

        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            result["error"] = f"XML Parse Error: {str(e)}"
            return result

        # Scan info
        for info in root.findall("scaninfo"):
            result["scan_info"] = {
                "type": info.get("type"),
                "protocol": info.get("protocol"),
                "numservices": info.get("numservices"),
                "services": info.get("services")
            }

        # Parse hosts
        for host_elem in root.findall("host"):
            host_data = NmapXmlParser._parse_host_element(host_elem)
            if host_data:
                result["hosts"].append(host_data)

        # Parse runstats
        runstats = root.find("runstats")
        if runstats is not None:
            finished = runstats.find("finished")
            if finished is not None:
                result["raw_summary"] = finished.get("summary", "")

        return result

    @staticmethod
    def _parse_host_element(host_elem: ET.Element) -> Optional[Dict[str, Any]]:
        status_elem = host_elem.find("status")
        state = status_elem.get("state", "unknown") if status_elem is not None else "unknown"

        # Addresses
        ipv4 = None
        ipv6 = None
        mac_addr = None
        mac_vendor = None

        for addr in host_elem.findall("address"):
            addr_type = addr.get("addrtype")
            addr_val = addr.get("addr")
            if addr_type == "ipv4":
                ipv4 = addr_val
            elif addr_type == "ipv6":
                ipv6 = addr_val
            elif addr_type == "mac":
                mac_addr = addr_val
                mac_vendor = addr.get("vendor")

        primary_ip = ipv4 or ipv6
        if not primary_ip:
            return None

        # Hostnames
        hostnames = []
        hostnames_elem = host_elem.find("hostnames")
        if hostnames_elem is not None:
            for hn in hostnames_elem.findall("hostname"):
                name = hn.get("name")
                if name:
                    hostnames.append(name)
        primary_hostname = hostnames[0] if hostnames else None

        # OS Detection
        os_name = None
        os_family = None
        os_accuracy = None
        os_cpe = None

        os_elem = host_elem.find("os")
        if os_elem is not None:
            for os_match in os_elem.findall("osmatch"):
                os_name = os_match.get("name")
                try:
                    os_accuracy = int(os_match.get("accuracy", "0"))
                except ValueError:
                    os_accuracy = None
                
                osclass = os_match.find("osclass")
                if osclass is not None:
                    os_family = osclass.get("osfamily")
                    cpe_elem = osclass.find("cpe")
                    if cpe_elem is not None and cpe_elem.text:
                        os_cpe = cpe_elem.text
                break

        # Ports & Services
        ports = []
        ports_elem = host_elem.find("ports")
        if ports_elem is not None:
            for port_elem in ports_elem.findall("port"):
                port_id_str = port_elem.get("portid")
                protocol = port_elem.get("protocol", "tcp")
                
                state_elem = port_elem.find("state")
                port_state = state_elem.get("state", "unknown") if state_elem is not None else "unknown"

                if not port_id_str:
                    continue
                
                try:
                    port_number = int(port_id_str)
                except ValueError:
                    continue

                service_name = None
                service_product = None
                service_version = None
                service_extrainfo = None
                service_cpe = None

                service_elem = port_elem.find("service")
                if service_elem is not None:
                    service_name = service_elem.get("name")
                    service_product = service_elem.get("product")
                    service_version = service_elem.get("version")
                    service_extrainfo = service_elem.get("extrainfo")

                    cpe_elem = service_elem.find("cpe")
                    if cpe_elem is not None and cpe_elem.text:
                        service_cpe = cpe_elem.text

                # Script outputs
                script_outputs = {}
                for script in port_elem.findall("script"):
                    s_id = script.get("id")
                    s_output = script.get("output")
                    if s_id and s_output:
                        script_outputs[s_id] = s_output

                ports.append({
                    "port_number": port_number,
                    "protocol": protocol,
                    "state": port_state,
                    "service_name": service_name,
                    "service_product": service_product,
                    "service_version": service_version,
                    "service_extrainfo": service_extrainfo,
                    "service_cpe": service_cpe,
                    "scripts": script_outputs
                })

        return {
            "ip": primary_ip,
            "ipv4": ipv4,
            "ipv6": ipv6,
            "mac_address": mac_addr,
            "mac_vendor": mac_vendor,
            "hostname": primary_hostname,
            "hostnames": hostnames,
            "status": state,
            "os_name": os_name,
            "os_family": os_family,
            "os_accuracy": os_accuracy,
            "os_cpe": os_cpe,
            "ports": ports
        }

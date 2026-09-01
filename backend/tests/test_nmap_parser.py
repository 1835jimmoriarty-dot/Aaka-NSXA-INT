import pytest
from app.parsers.nmap_xml_parser import NmapXmlParser

SAMPLE_NMAP_XML = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nmaprun>
<nmaprun scanner="nmap" args="nmap -F -sV -oX - 192.168.1.50" version="7.94">
<scaninfo type="syn" protocol="tcp" numservices="100" services="1-1000"/>
<host status="up">
  <status state="up" reason="arp-response"/>
  <address addr="192.168.1.50" addrtype="ipv4"/>
  <address addr="00:0C:29:8A:1B:3C" addrtype="mac" vendor="VMware"/>
  <hostnames>
    <hostname name="server.local" type="PTR"/>
  </hostnames>
  <ports>
    <port protocol="tcp" portid="80">
      <state state="open" reason="syn-ack"/>
      <service name="http" product="Apache httpd" version="2.4.49" method="probed" conf="10">
        <cpe>cpe:/a:apache:http_server:2.4.49</cpe>
      </service>
    </port>
    <port protocol="tcp" portid="22">
      <state state="open" reason="syn-ack"/>
      <service name="ssh" product="OpenSSH" version="8.2p1" method="probed" conf="10">
        <cpe>cpe:/a:openssh:openssh:8.2p1</cpe>
      </service>
    </port>
  </ports>
  <os>
    <osmatch name="Linux 5.4" accuracy="95">
      <osclass type="general purpose" vendor="Linux" osfamily="Linux" accuracy="95">
        <cpe>cpe:/o:linux:linux_kernel:5.4</cpe>
      </osclass>
    </osmatch>
  </os>
</host>
<runstats>
  <finished time="1700000000" timestr="Thu Nov 14 12:00:00 2024" summary="Nmap done at Thu Nov 14 12:00:00 2024; 1 IP address (1 host up) scanned in 2.15 seconds" elapsed="2.15" exit="success"/>
</runstats>
</nmaprun>
"""

def test_nmap_xml_parser():
    res = NmapXmlParser.parse_xml_string(SAMPLE_NMAP_XML)
    assert res["error"] is None
    assert len(res["hosts"]) == 1

    host = res["hosts"][0]
    assert host["ip"] == "192.168.1.50"
    assert host["mac_address"] == "00:0C:29:8A:1B:3C"
    assert host["mac_vendor"] == "VMware"
    assert host["hostname"] == "server.local"
    assert host["os_name"] == "Linux 5.4"
    assert host["os_accuracy"] == 95

    ports = host["ports"]
    assert len(ports) == 2
    
    http_port = next(p for p in ports if p["port_number"] == 80)
    assert http_port["service_name"] == "http"
    assert http_port["service_product"] == "Apache httpd"
    assert http_port["service_version"] == "2.4.49"
    assert http_port["service_cpe"] == "cpe:/a:apache:http_server:2.4.49"

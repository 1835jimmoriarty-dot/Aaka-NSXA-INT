import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.logging import logger, log_buffer
from app.api.websocket import ws_manager
from app.models import Project, Target, Host, Port, Service, Technology, Vulnerability, Finding, ScanJob, Task
from app.adapters.registry import adapter_registry
from app.adapters.nmap_adapter import NmapAdapter
from app.engine.executor import SubprocessExecutor
from app.engine.cve_enrichment import CVEEnrichmentEngine
from app.engine.risk_engine import RiskEngine
from app.engine.enumeration import StagedEnumerationEngine

class ScanOrchestrator:
    """Manages scan job execution, live database updates, staged reconnaissance, and WebSocket broadcasts."""

    _active_executors: Dict[int, SubprocessExecutor] = {}

    @classmethod
    async def start_scan(cls, scan_job_id: int):
        asyncio.create_task(cls._run_scan_job(scan_job_id))

    @classmethod
    async def cancel_scan(cls, scan_job_id: int) -> bool:
        if scan_job_id in cls._active_executors:
            executor = cls._active_executors[scan_job_id]
            await executor.cancel()
            db = SessionLocal()
            try:
                job = db.query(ScanJob).filter(ScanJob.id == scan_job_id).first()
                if job:
                    job.status = "CANCELLED"
                    job.completed_at = datetime.utcnow()
                    db.commit()
                    await ws_manager.broadcast_project(job.project_id, "scan_status", {
                        "scan_job_id": scan_job_id,
                        "status": "CANCELLED",
                        "progress": job.progress,
                        "current_stage": "Cancelled by user"
                    })
                return True
            finally:
                db.close()
        return False

    @classmethod
    async def _run_scan_job(cls, scan_job_id: int):
        db: Session = SessionLocal()
        executor: Optional[SubprocessExecutor] = None

        try:
            job: Optional[ScanJob] = db.query(ScanJob).filter(ScanJob.id == scan_job_id).first()
            if not job:
                logger.error(f"ScanJob {scan_job_id} not found")
                return

            job.status = "RUNNING"
            job.started_at = datetime.utcnow()
            job.progress = 10.0
            job.current_stage = "Initializing Reconnaissance"
            db.commit()

            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "RUNNING",
                "progress": 10.0,
                "current_stage": job.current_stage
            })

            # Check Nmap tool availability
            nmap_adapter: NmapAdapter = adapter_registry.get_adapter("nmap")
            avail, version, guidance = nmap_adapter.check_availability()
            if not avail:
                err_msg = guidance or "Nmap executable not available on host system."
                job.status = "FAILED"
                job.error_message = err_msg
                job.completed_at = datetime.utcnow()
                db.commit()
                await ws_manager.broadcast_project(job.project_id, "scan_status", {
                    "scan_job_id": scan_job_id,
                    "status": "FAILED",
                    "error": err_msg
                })
                return

            # Create Task record for Nmap
            cmd_args = nmap_adapter.build_command_args(job.target_spec, {
                "profile": job.profile,
                "custom_ports": job.raw_arguments
            })
            job.raw_arguments = " ".join(cmd_args)
            
            task = Task(
                scan_job_id=job.id,
                project_id=job.project_id,
                tool_name="Nmap",
                target=job.target_spec,
                command_line=" ".join(cmd_args),
                status="RUNNING",
                progress=15.0,
                start_time=datetime.utcnow()
            )
            db.add(task)
            db.commit()
            db.refresh(task)

            # Set up executor
            executor = SubprocessExecutor(timeout=1800)
            cls._active_executors[scan_job_id] = executor

            job.progress = 25.0
            job.current_stage = f"Executing Nmap ({job.profile} profile)"
            db.commit()
            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "RUNNING",
                "progress": 25.0,
                "current_stage": job.current_stage
            })

            # Stream stdout callbacks
            loop = asyncio.get_event_loop()
            def on_stdout_line(line: str):
                log_buffer.add("INFO", line, module="nmap", project_id=job.project_id, scan_id=job.id)
                # Dispatch real-time terminal output
                asyncio.run_coroutine_threadsafe(
                    ws_manager.broadcast_project(job.project_id, "task_log", {
                        "task_id": task.id,
                        "scan_job_id": scan_job_id,
                        "line": line
                    }),
                    loop
                )

            exec_res = await executor.execute(cmd_args, on_stdout_line=on_stdout_line)

            task.end_time = datetime.utcnow()
            task.duration_seconds = exec_res.get("duration_seconds", 0.0)
            task.stdout_log = exec_res.get("stdout", "")
            task.stderr_log = exec_res.get("stderr", "")
            task.return_code = exec_res.get("return_code")
            task.status = "COMPLETED" if exec_res.get("success") else "FAILED"
            db.commit()

            if not exec_res.get("success") and not exec_res.get("stdout"):
                job.status = "FAILED"
                job.error_message = exec_res.get("stderr") or "Nmap failed to execute."
                job.completed_at = datetime.utcnow()
                db.commit()
                await ws_manager.broadcast_project(job.project_id, "scan_status", {
                    "scan_job_id": scan_job_id,
                    "status": "FAILED",
                    "error": job.error_message
                })
                return

            # Parse XML output
            job.progress = 60.0
            job.current_stage = "Parsing Discovery and Port Information"
            db.commit()
            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "RUNNING",
                "progress": 60.0,
                "current_stage": job.current_stage
            })

            parsed_nmap = nmap_adapter.parse_output(exec_res.get("stdout", ""), exec_res.get("stderr", ""))
            discovered_hosts = parsed_nmap.get("hosts", [])

            # Process and persist hosts and ports
            for h_data in discovered_hosts:
                host_ip = h_data.get("ip")
                if not host_ip:
                    continue

                existing_host = db.query(Host).filter(
                    Host.project_id == job.project_id,
                    Host.ip == host_ip
                ).first()

                if not existing_host:
                    existing_host = Host(
                        project_id=job.project_id,
                        ip=host_ip,
                        ipv6=h_data.get("ipv6"),
                        hostname=h_data.get("hostname"),
                        mac_address=h_data.get("mac_address"),
                        mac_vendor=h_data.get("mac_vendor"),
                        os_name=h_data.get("os_name"),
                        os_family=h_data.get("os_family"),
                        os_accuracy=h_data.get("os_accuracy"),
                        os_cpe=h_data.get("os_cpe"),
                        status=h_data.get("status", "up"),
                        first_seen=datetime.utcnow(),
                        last_scanned=datetime.utcnow()
                    )
                    db.add(existing_host)
                    db.commit()
                    db.refresh(existing_host)
                else:
                    existing_host.hostname = h_data.get("hostname") or existing_host.hostname
                    existing_host.os_name = h_data.get("os_name") or existing_host.os_name
                    existing_host.os_cpe = h_data.get("os_cpe") or existing_host.os_cpe
                    existing_host.last_scanned = datetime.utcnow()
                    db.commit()

                # Process Ports
                for p_data in h_data.get("ports", []):
                    port_num = p_data.get("port_number")
                    protocol = p_data.get("protocol", "tcp")

                    existing_port = db.query(Port).filter(
                        Port.host_id == existing_host.id,
                        Port.port_number == port_num,
                        Port.protocol == protocol
                    ).first()

                    if not existing_port:
                        existing_port = Port(
                            host_id=existing_host.id,
                            project_id=job.project_id,
                            port_number=port_num,
                            protocol=protocol,
                            state=p_data.get("state", "open"),
                            service_name=p_data.get("service_name"),
                            service_product=p_data.get("service_product"),
                            service_version=p_data.get("service_version"),
                            service_extrainfo=p_data.get("service_extrainfo"),
                            service_cpe=p_data.get("service_cpe"),
                            script_output_json=json.dumps(p_data.get("scripts", {}))
                        )
                        db.add(existing_port)
                    else:
                        existing_port.state = p_data.get("state", existing_port.state)
                        existing_port.service_name = p_data.get("service_name") or existing_port.service_name
                        existing_port.service_product = p_data.get("service_product") or existing_port.service_product
                        existing_port.service_version = p_data.get("service_version") or existing_port.service_version
                        existing_port.service_cpe = p_data.get("service_cpe") or existing_port.service_cpe
                        existing_port.script_output_json = json.dumps(p_data.get("scripts", {}))
                    db.commit()

                    # Save service entry
                    if p_data.get("service_name"):
                        svc_entry = db.query(Service).filter(
                            Service.project_id == job.project_id,
                            Service.name == p_data.get("service_name")
                        ).first()
                        if not svc_entry:
                            svc_entry = Service(
                                project_id=job.project_id,
                                name=p_data.get("service_name"),
                                product=p_data.get("service_product"),
                                version=p_data.get("service_version"),
                                port_count=1,
                                host_count=1,
                                last_detected=datetime.utcnow()
                            )
                            db.add(svc_entry)
                            db.commit()

                    # Correlate CVEs from service
                    cve_findings = CVEEnrichmentEngine.correlate_service(
                        service_name=p_data.get("service_name"),
                        product=p_data.get("service_product"),
                        version=p_data.get("service_version"),
                        cpe=p_data.get("service_cpe"),
                        script_outputs=p_data.get("scripts", {})
                    )

                    for cf in cve_findings:
                        # Find or create vulnerability
                        if cf.get("cve_id"):
                            vuln = db.query(Vulnerability).filter(Vulnerability.cve_id == cf["cve_id"]).first()
                            if not vuln:
                                vuln = Vulnerability(
                                    cve_id=cf["cve_id"],
                                    title=cf["title"],
                                    description=cf.get("description", ""),
                                    cvss_v3=cf.get("cvss_score"),
                                    severity=cf.get("severity", "MEDIUM"),
                                    cwe_id=cf.get("cwe_id"),
                                    has_exploit=cf.get("has_exploit", False),
                                    exploit_details=cf.get("exploit_details")
                                )
                                db.add(vuln)
                                db.commit()
                                db.refresh(vuln)
                            vuln_id = vuln.id
                        else:
                            vuln_id = None

                        # Save finding
                        existing_finding = db.query(Finding).filter(
                            Finding.host_id == existing_host.id,
                            Finding.port_id == existing_port.id,
                            Finding.title == cf["title"]
                        ).first()

                        if not existing_finding:
                            existing_finding = Finding(
                                project_id=job.project_id,
                                host_id=existing_host.id,
                                port_id=existing_port.id,
                                vulnerability_id=vuln_id,
                                title=cf["title"],
                                cve_id=cf.get("cve_id"),
                                severity=cf.get("severity", "MEDIUM"),
                                cvss_score=cf.get("cvss_score", 5.0),
                                confidence=cf.get("confidence", "POTENTIAL"),
                                evidence=cf.get("evidence"),
                                source_tool=cf.get("source_tool", "cve-enricher"),
                                status="OPEN",
                                first_seen=datetime.utcnow()
                            )
                            db.add(existing_finding)
                            db.commit()

            # Stage 2: Staged Automated Enumeration (HTTP, TLS, SMB, SSH)
            job.progress = 75.0
            job.current_stage = "Staged Automated Enumeration & Service Deep-Dive"
            db.commit()
            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "RUNNING",
                "progress": 75.0,
                "current_stage": job.current_stage
            })

            for h_data in discovered_hosts:
                host_ip = h_data.get("ip")
                host_record = db.query(Host).filter(Host.project_id == job.project_id, Host.ip == host_ip).first()
                if not host_record:
                    continue

                open_ports = h_data.get("ports", [])
                staged_res = await StagedEnumerationEngine.enumerate_host_services(
                    host_ip=host_ip,
                    open_ports=open_ports,
                    on_log=lambda msg: on_stdout_line(msg)
                )

                # Persist additional technologies
                for t in staged_res.get("additional_technologies", []):
                    tech_rec = Technology(
                        project_id=job.project_id,
                        host_id=host_record.id,
                        name=t.get("name", "Unknown"),
                        category=t.get("category", "Web Server"),
                        confidence=t.get("confidence", 1.0),
                        detected_by=t.get("detected_by", "aaka-http-inspector")
                    )
                    db.add(tech_rec)
                db.commit()

                # Persist additional findings
                for f in staged_res.get("additional_findings", []):
                    port_rec = db.query(Port).filter(
                        Port.host_id == host_record.id,
                        Port.port_number == f.get("port_number", 80)
                    ).first()
                    port_id = port_rec.id if port_rec else None

                    finding_rec = Finding(
                        project_id=job.project_id,
                        host_id=host_record.id,
                        port_id=port_id,
                        title=f.get("title", "Security Misconfiguration"),
                        cve_id=f.get("cve_id"),
                        severity=f.get("severity", "LOW"),
                        cvss_score=f.get("cvss", 4.0),
                        confidence=f.get("confidence", "CONFIRMED"),
                        evidence=f.get("evidence"),
                        source_tool=f.get("source_tool", "staged-enumerator"),
                        status="OPEN",
                        first_seen=datetime.utcnow()
                    )
                    db.add(finding_rec)
                db.commit()

            # Stage 3: Explainable Risk Scoring
            job.progress = 90.0
            job.current_stage = "Computing Explainable Risk Intelligence"
            db.commit()
            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "RUNNING",
                "progress": 90.0,
                "current_stage": job.current_stage
            })

            # Calculate risk for all hosts in project
            all_hosts = db.query(Host).filter(Host.project_id == job.project_id).all()
            for host_obj in all_hosts:
                h_ports = [{"port_number": p.port_number, "state": p.state} for p in host_obj.ports]
                h_findings = [{
                    "severity": f.severity,
                    "cvss_score": f.cvss_score,
                    "confidence": f.confidence,
                    "title": f.title,
                    "cve_id": f.cve_id
                } for f in host_obj.findings]

                risk_score, risk_lvl, factors = RiskEngine.calculate_host_risk(
                    ports=h_ports,
                    findings=h_findings,
                    is_up=host_obj.status == "up"
                )

                host_obj.risk_score = risk_score
                host_obj.risk_level = risk_lvl
                host_obj.risk_factors_json = json.dumps(factors)
            db.commit()

            # Completion
            job.progress = 100.0
            job.status = "COMPLETED"
            job.current_stage = "Assessment Completed"
            job.completed_at = datetime.utcnow()
            if job.started_at:
                job.duration_seconds = (job.completed_at - job.started_at).total_seconds()
            db.commit()

            await ws_manager.broadcast_project(job.project_id, "scan_status", {
                "scan_job_id": scan_job_id,
                "status": "COMPLETED",
                "progress": 100.0,
                "current_stage": "Assessment Completed",
                "duration_seconds": job.duration_seconds
            })

        except Exception as e:
            logger.error(f"Error in scan job {scan_job_id}: {str(e)}", exc_info=True)
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                db.commit()
                await ws_manager.broadcast_project(job.project_id, "scan_status", {
                    "scan_job_id": scan_job_id,
                    "status": "FAILED",
                    "error": str(e)
                })
        finally:
            cls._active_executors.pop(scan_job_id, None)
            db.close()

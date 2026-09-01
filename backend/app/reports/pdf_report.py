import io
import json
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class PDFReportGenerator:
    """Generates enterprise cybersecurity assessment PDF reports in Midnight Purple theme."""

    @staticmethod
    def generate_report(project_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Midnight Purple & Cyber Theme Styles
        color_bg = colors.HexColor("#080611")
        color_purple = colors.HexColor("#7C3AED")
        color_bright = colors.HexColor("#9B5CFF")
        color_text = colors.HexColor("#1E1935")
        color_muted = colors.HexColor("#64748B")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=color_purple,
            spaceAfter=8
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=color_muted,
            spaceAfter=15
        )

        h1_style = ParagraphStyle(
            "Heading1_Custom",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=color_purple,
            spaceBefore=14,
            spaceAfter=8
        )

        h2_style = ParagraphStyle(
            "Heading2_Custom",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=color_text,
            spaceBefore=10,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            "Body_Custom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=color_text
        )

        badge_critical = colors.HexColor("#EF4444")
        badge_high = colors.HexColor("#F97316")
        badge_medium = colors.HexColor("#F59E0B")
        badge_low = colors.HexColor("#3B82F6")

        elements = []

        # --- Header & Branding ---
        elements.append(Paragraph("AAKA-NSXA INTELLIGENCE", title_style))
        elements.append(Paragraph("Network Security Analytics & Intelligence Assessment Report", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=color_bright, spaceAfter=15))

        # --- Project Meta Table ---
        p_name = project_data.get("name", "Assessment")
        p_desc = project_data.get("description", "Comprehensive Network Reconnaissance & Security Analysis")
        gen_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        meta_data = [
            [Paragraph("<b>Project Name:</b>", body_style), Paragraph(p_name, body_style),
             Paragraph("<b>Generated:</b>", body_style), Paragraph(gen_time, body_style)],
            [Paragraph("<b>Classification:</b>", body_style), Paragraph("CONFIDENTIAL / SECURITY AUDIT", body_style),
             Paragraph("<b>Platform:</b>", body_style), Paragraph("AAKA-NSXA Intelligence 1.0", body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[1.3*inch, 2.3*inch, 1.1*inch, 2.3*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # --- Executive Summary ---
        elements.append(Paragraph("1. Executive Summary", h1_style))
        
        hosts = project_data.get("hosts", [])
        findings = project_data.get("findings", [])
        total_hosts = len(hosts)
        total_findings = len(findings)
        
        crit_count = sum(1 for f in findings if f.get("severity") == "CRITICAL")
        high_count = sum(1 for f in findings if f.get("severity") == "HIGH")
        med_count = sum(1 for f in findings if f.get("severity") == "MEDIUM")
        low_count = sum(1 for f in findings if f.get("severity") == "LOW")

        avg_risk = 0.0
        if hosts:
            avg_risk = round(sum(h.get("risk_score", 0.0) for h in hosts) / len(hosts), 1)

        summary_text = (
            f"This network security intelligence report outlines the reconnaissance findings, discovered attack surfaces, "
            f"and correlated vulnerability intelligence across <b>{total_hosts} discovered host(s)</b>. "
            f"A total of <b>{total_findings} security finding(s)</b> were identified ({crit_count} Critical, {high_count} High, "
            f"{med_count} Medium, {low_count} Low). The average calculated host risk score across this scope is <b>{avg_risk}/100</b>."
        )
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 10))

        # Metric Summary Cards Table
        summary_table_data = [
            [
                Paragraph("<font size=14><b>{}</b></font><br/><font color='#64748B' size=8>Hosts Discovered</font>".format(total_hosts), body_style),
                Paragraph("<font size=14 color='#EF4444'><b>{}</b></font><br/><font color='#64748B' size=8>Critical Findings</font>".format(crit_count), body_style),
                Paragraph("<font size=14 color='#F97316'><b>{}</b></font><br/><font color='#64748B' size=8>High Findings</font>".format(high_count), body_style),
                Paragraph("<font size=14 color='#F59E0B'><b>{}</b></font><br/><font color='#64748B' size=8>Medium Findings</font>".format(med_count), body_style),
                Paragraph("<font size=14 color='#7C3AED'><b>{}/100</b></font><br/><font color='#64748B' size=8>Avg Risk Score</font>".format(avg_risk), body_style),
            ]
        ]
        sum_table = Table(summary_table_data, colWidths=[1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 15))

        # --- Discovered Host Inventory ---
        elements.append(Paragraph("2. Host Inventory & Intelligence", h1_style))
        if hosts:
            host_table_rows = [
                [
                    Paragraph("<b>IP Address</b>", body_style),
                    Paragraph("<b>Hostname</b>", body_style),
                    Paragraph("<b>OS Detection</b>", body_style),
                    Paragraph("<b>Open Ports</b>", body_style),
                    Paragraph("<b>Risk Score</b>", body_style)
                ]
            ]
            for h in hosts:
                open_ports_str = ", ".join(str(p.get("port_number")) for p in h.get("ports", []) if p.get("state") == "open") or "None"
                risk_lvl = h.get("risk_level", "LOW")
                r_color = "#EF4444" if risk_lvl == "CRITICAL" else "#F97316" if risk_lvl == "HIGH" else "#F59E0B" if risk_lvl == "MEDIUM" else "#3B82F6"
                
                host_table_rows.append([
                    Paragraph(h.get("ip", "N/A"), body_style),
                    Paragraph(h.get("hostname") or "—", body_style),
                    Paragraph(h.get("os_name") or "Unknown", body_style),
                    Paragraph(open_ports_str, body_style),
                    Paragraph(f"<font color='{r_color}'><b>{h.get('risk_score', 0.0)} ({risk_lvl})</b></font>", body_style)
                ])

            h_table = Table(host_table_rows, colWidths=[1.5*inch, 1.5*inch, 1.8*inch, 1.2*inch, 1.0*inch])
            h_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#7C3AED")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(h_table)
        else:
            elements.append(Paragraph("<i>No hosts discovered in this assessment scope.</i>", body_style))
        elements.append(Spacer(1, 15))

        # --- Security Findings & Vulnerability Details ---
        elements.append(Paragraph("3. Detailed Security Findings & Correlated CVEs", h1_style))
        if findings:
            find_table_rows = [
                [
                    Paragraph("<b>Finding / Title</b>", body_style),
                    Paragraph("<b>CVE ID</b>", body_style),
                    Paragraph("<b>Severity</b>", body_style),
                    Paragraph("<b>CVSS</b>", body_style),
                    Paragraph("<b>Status / Source</b>", body_style)
                ]
            ]
            for f in findings:
                sev = f.get("severity", "LOW")
                s_color = "#EF4444" if sev == "CRITICAL" else "#F97316" if sev == "HIGH" else "#F59E0B" if sev == "MEDIUM" else "#3B82F6"
                find_table_rows.append([
                    Paragraph(f"<b>{f.get('title')}</b><br/><font color='#64748B' size=7>{f.get('evidence', '')[:120]}</font>", body_style),
                    Paragraph(f.get("cve_id") or "—", body_style),
                    Paragraph(f"<font color='{s_color}'><b>{sev}</b></font>", body_style),
                    Paragraph(str(f.get("cvss_score", "—")), body_style),
                    Paragraph(f"{f.get('confidence', 'POTENTIAL')}<br/><font size=7 color='#64748B'>{f.get('source_tool')}</font>", body_style)
                ])

            f_table = Table(find_table_rows, colWidths=[2.7*inch, 1.1*inch, 0.9*inch, 0.7*inch, 1.6*inch])
            f_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#18142A")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(f_table)
        else:
            elements.append(Paragraph("<i>No vulnerabilities or security findings identified.</i>", body_style))
        elements.append(Spacer(1, 15))

        # --- Remediation Guidance ---
        elements.append(Paragraph("4. Recommended Security Remediations", h1_style))
        rec_text = (
            "1. <b>Patch and Upgrade Critical Software</b>: Upgrade services with confirmed CVEs (e.g. OpenSSH, Apache, Samba) to the latest vendor-supported releases.<br/>"
            "2. <b>Network Segmentation & Port Hardening</b>: Restrict administrative and high-risk ports (445 SMB, 3389 RDP, database ports) using firewall rules and VPC access controls.<br/>"
            "3. <b>Enforce TLS 1.2+ & Modern Ciphers</b>: Disable legacy SSLv3, TLS 1.0, and weak ciphers; ensure valid SSL/TLS certificates with automated renewal.<br/>"
            "4. <b>Web Security Headers</b>: Enforce HTTP Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options on all web applications."
        )
        elements.append(Paragraph(rec_text, body_style))

        doc.build(elements)
        return buffer.getvalue()

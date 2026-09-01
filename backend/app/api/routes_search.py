from typing import Dict, List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Host, Port, Finding, Project, Technology, Vulnerability
from app.schemas import SearchResponse, SearchResultItem

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(..., min_length=1),
    project_id: int = None,
    db: Session = Depends(get_db)
):
    query_str = f"%{q.strip()}%"
    results_by_type: Dict[str, List[SearchResultItem]] = {
        "hosts": [],
        "ports": [],
        "findings": [],
        "technologies": [],
        "cves": []
    }
    total_count = 0

    # Search Hosts
    h_query = db.query(Host).filter((Host.ip.ilike(query_str)) | (Host.hostname.ilike(query_str)) | (Host.os_name.ilike(query_str)))
    if project_id:
        h_query = h_query.filter(Host.project_id == project_id)
    for h in h_query.limit(10).all():
        results_by_type["hosts"].append(SearchResultItem(
            type="host",
            title=h.ip,
            subtitle=f"{h.hostname or 'No Hostname'} • {h.os_name or 'Unknown OS'}",
            id=h.id,
            project_id=h.project_id,
            risk_level=h.risk_level,
            url_path=f"/hosts/{h.id}"
        ))
        total_count += 1

    # Search Findings
    f_query = db.query(Finding).filter((Finding.title.ilike(query_str)) | (Finding.cve_id.ilike(query_str)))
    if project_id:
        f_query = f_query.filter(Finding.project_id == project_id)
    for f in f_query.limit(10).all():
        results_by_type["findings"].append(SearchResultItem(
            type="finding",
            title=f.title,
            subtitle=f"{f.cve_id or 'No CVE'} • CVSS {f.cvss_score}",
            id=f.id,
            project_id=f.project_id,
            risk_level=f.severity,
            url_path=f"/vulnerabilities"
        ))
        total_count += 1

    # Search Technologies
    t_query = db.query(Technology).filter(Technology.name.ilike(query_str))
    if project_id:
        t_query = t_query.filter(Technology.project_id == project_id)
    for t in t_query.limit(10).all():
        results_by_type["technologies"].append(SearchResultItem(
            type="technology",
            title=t.name,
            subtitle=f"Category: {t.category}",
            id=t.id,
            project_id=t.project_id,
            risk_level="INFO",
            url_path=f"/hosts/{t.host_id}"
        ))
        total_count += 1

    return SearchResponse(
        query=q,
        total_results=total_count,
        results_by_type=results_by_type
    )

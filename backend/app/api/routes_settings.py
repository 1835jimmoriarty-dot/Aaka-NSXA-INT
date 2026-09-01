from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models import Setting

router = APIRouter(prefix="/settings", tags=["Settings"])

OPEN_SOURCE_LICENSES = [
    {
        "component": "Nmap Network Mapper",
        "license": "Nmap Public Source License (NPSL) / GPL-2.0",
        "url": "https://nmap.org",
        "attribution": "Nmap is an open source utility for network exploration and security auditing. Copyright (c) Insecure.Com LLC."
    },
    {
        "component": "Legion Reconnaissance Framework",
        "license": "GPL-3.0",
        "url": "https://github.com/Abacus-Group-RTO/legion",
        "attribution": "Legion is an open source network penetration testing tool. Functional workflows and reconnaissance concepts adapted under GPL-3.0 attribution."
    },
    {
        "component": "FastAPI & Starlette",
        "license": "MIT",
        "url": "https://fastapi.tiangolo.com",
        "attribution": "Copyright (c) 2018 Sebastián Ramírez."
    },
    {
        "component": "SQLAlchemy",
        "license": "MIT",
        "url": "https://www.sqlalchemy.org",
        "attribution": "Copyright (c) 2005-2024 Michael Bayer and contributors."
    },
    {
        "component": "ReportLab",
        "license": "BSD License",
        "url": "https://www.reportlab.com",
        "attribution": "Copyright (c) 2000-2024 ReportLab Inc."
    },
    {
        "component": "React & React DOM",
        "license": "MIT",
        "url": "https://react.dev",
        "attribution": "Copyright (c) Meta Platforms, Inc. and affiliates."
    },
    {
        "component": "Tailwind CSS",
        "license": "MIT",
        "url": "https://tailwindcss.com",
        "attribution": "Copyright (c) Tailwind Labs, Inc."
    },
    {
        "component": "Lucide Icons",
        "license": "ISC",
        "url": "https://lucide.dev",
        "attribution": "Copyright (c) Lucide Contributors."
    },
    {
        "component": "Recharts",
        "license": "MIT",
        "url": "https://recharts.org",
        "attribution": "Copyright (c) 2015-2024 Recharts Group."
    }
]

@router.get("/licenses")
def get_open_source_licenses():
    return OPEN_SOURCE_LICENSES

@router.get("/config")
def get_current_configuration():
    return {
        "project_name": settings.PROJECT_NAME,
        "nmap_path": settings.NMAP_PATH,
        "whatweb_path": settings.WHATWEB_PATH,
        "nikto_path": settings.NIKTO_PATH,
        "max_concurrent_jobs": settings.MAX_CONCURRENT_JOBS,
        "scan_timeout": settings.DEFAULT_SCAN_TIMEOUT,
        "database_url": settings.DATABASE_URL.split("///")[-1] if "///" in settings.DATABASE_URL else settings.DATABASE_URL
    }

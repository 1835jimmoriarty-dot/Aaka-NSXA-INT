from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
from pathlib import Path
from app.core.config import settings
from app.core.database import init_db
from app.core.logging import logger
from app.api.websocket import ws_manager
from app.api.routes_projects import router as projects_router
from app.api.routes_targets import router as targets_router
from app.api.routes_scans import router as scans_router
from app.api.routes_hosts import router as hosts_router
from app.api.routes_services import router as services_router
from app.api.routes_vulnerabilities import router as vuln_router
from app.api.routes_tasks import router as tasks_router
from app.api.routes_reports import router as reports_router
from app.api.routes_search import router as search_router
from app.api.routes_health import router as health_router
from app.api.routes_settings import router as settings_router
from app.api.routes_logs import router as logs_router

FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AAKA-NSXA Intelligence backend...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down AAKA-NSXA Intelligence backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready Network Security Analytics & Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = settings.API_V1_STR
app.include_router(projects_router, prefix=api_v1)
app.include_router(targets_router, prefix=api_v1)
app.include_router(scans_router, prefix=api_v1)
app.include_router(hosts_router, prefix=api_v1)
app.include_router(services_router, prefix=api_v1)
app.include_router(vuln_router, prefix=api_v1)
app.include_router(tasks_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(search_router, prefix=api_v1)
app.include_router(health_router, prefix=api_v1)
app.include_router(settings_router, prefix=api_v1)
app.include_router(logs_router, prefix=api_v1)

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket, project_id: int = None):
    await ws_manager.connect(websocket, project_id=project_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, project_id=project_id)
    except Exception:
        ws_manager.disconnect(websocket, project_id=project_id)

# Serve React frontend static files
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        blocked = ("api/", "ws/", "docs", "openapi", "redoc")
        if any(full_path.startswith(p) for p in blocked):
            raise HTTPException(status_code=404)
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {"platform": "AAKA-NSXA Intelligence", "status": "OPERATIONAL", "docs": "/docs"}

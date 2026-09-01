from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
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

# Real-Time WebSocket Endpoint
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket, project_id: int = None):
    await ws_manager.connect(websocket, project_id=project_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, project_id=project_id)
    except Exception as e:
        ws_manager.disconnect(websocket, project_id=project_id)

@app.get("/")
def root():
    return {
        "platform": "AAKA-NSXA Intelligence",
        "description": "Network Security Analytics & Intelligence Platform",
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

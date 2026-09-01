import json
import asyncio
from typing import Dict, List, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from app.core.logging import logger

class ConnectionManager:
    def __init__(self):
        # Global listeners and project-specific listeners
        self.active_connections: Set[WebSocket] = set()
        self.project_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        if project_id is not None:
            if project_id not in self.project_connections:
                self.project_connections[project_id] = set()
            self.project_connections[project_id].add(websocket)
        logger.info(f"WebSocket client connected. Total global: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, project_id: int = None):
        self.active_connections.discard(websocket)
        if project_id is not None and project_id in self.project_connections:
            self.project_connections[project_id].discard(websocket)
        logger.info(f"WebSocket client disconnected. Total global: {len(self.active_connections)}")

    async def broadcast_global(self, event_type: str, data: Any):
        payload = json.dumps({"event": event_type, "data": data})
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.active_connections.discard(d)

    async def broadcast_project(self, project_id: int, event_type: str, data: Any):
        payload = json.dumps({"event": event_type, "project_id": project_id, "data": data})
        # Send to project subscribers and global subscribers
        targets = set(self.active_connections)
        if project_id in self.project_connections:
            targets.update(self.project_connections[project_id])

        dead = []
        for conn in targets:
            try:
                await conn.send_text(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.active_connections.discard(d)

ws_manager = ConnectionManager()

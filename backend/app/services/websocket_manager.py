"""
WebSocket Manager for Real-Time Race Room Updates.

Maintains active WebSocket connections grouped by race_id.
Enables real-time push of:
  - Submission verdict streams
  - Race completion & winner announcements
  - Live opponent activity signals
"""

import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("codeclash.websocket")


class ConnectionManager:
    def __init__(self):
        # Maps race_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, race_id: str, websocket: WebSocket):
        """Accept connection and add to race room pool."""
        await websocket.accept()
        if race_id not in self.active_connections:
            self.active_connections[race_id] = []
        self.active_connections[race_id].append(websocket)
        logger.info(f"WebSocket connected to race {race_id} (Total: {len(self.active_connections[race_id])})")

    def disconnect(self, race_id: str, websocket: WebSocket):
        """Remove WebSocket connection from race room pool."""
        if race_id in self.active_connections:
            if websocket in self.active_connections[race_id]:
                self.active_connections[race_id].remove(websocket)
            if not self.active_connections[race_id]:
                del self.active_connections[race_id]
        logger.info(f"WebSocket disconnected from race {race_id}")

    async def broadcast(self, race_id: str, message: dict):
        """Broadcast JSON message to all connected clients in a race room."""
        if race_id not in self.active_connections:
            return

        dead_connections = []
        for connection in self.active_connections[race_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to WS connection: {e}")
                dead_connections.append(connection)

        # Cleanup failed connections
        for dead in dead_connections:
            self.disconnect(race_id, dead)


ws_manager = ConnectionManager()

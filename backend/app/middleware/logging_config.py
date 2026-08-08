"""
Structured logging configuration.

WHY STRUCTURED LOGGING:
  Plain print() statements are hard to search, filter, and aggregate.
  Structured JSON logs allow:
    - Machine parsing (ELK stack, CloudWatch, Datadog)
    - Filtering by request_id, user_id, endpoint, status code
    - Latency analysis (duration_ms per request)
    - Error tracking with full context

FORMAT:
  Each log line is a JSON object with standard fields:
    {"timestamp": "...", "level": "INFO", "message": "...", "request_id": "abc123", ...}
"""

import logging
import json
import sys
import uuid
import time
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs logs as JSON objects."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Merge extra fields (request_id, user_id, etc.)
        if hasattr(record, "__dict__"):
            for key, value in record.__dict__.items():
                if key not in (
                    "name", "msg", "args", "levelname", "levelno", "pathname",
                    "filename", "module", "exc_info", "exc_text", "stack_info",
                    "lineno", "funcName", "created", "msecs", "relativeCreated",
                    "thread", "threadName", "processName", "process", "message",
                    "taskName",
                ):
                    log_entry[key] = value
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        return json.dumps(log_entry, default=str)


def setup_logging():
    """Configure the root logger with our JSON formatter."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [handler]

    # Suppress noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs every HTTP request with:
      - request_id: unique per request (for tracing)
      - method + path
      - status code
      - duration_ms
    """

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Attach request_id to request state for use in handlers
        request.state.request_id = request_id

        logger = logging.getLogger("codeclash.http")

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 1)
            logger.info(
                f"{request.method} {request.url.path} → {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                },
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 1)
            logger.error(
                f"{request.method} {request.url.path} → ERROR",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise

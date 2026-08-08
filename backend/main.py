"""
CodeClash Backend Entrypoint

Re-exports the FastAPI app instance from app.main.
This ensures running either `uvicorn main:app` or `uvicorn app.main:app`
loads the complete, modular app structure.
"""

from app.main import app
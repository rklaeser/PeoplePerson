#!/usr/bin/env python3
"""
Run FastAPI AI server
"""
import uvicorn
from fastapi_app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "fastapi_app.main:app",
        host="0.0.0.0",
        port=8001,  # Different port from Django
        reload=True,
        log_level="info"
    )
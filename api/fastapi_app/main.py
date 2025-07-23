from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ai
from .config import ENVIRONMENT

app = FastAPI(
    title="PeoplePerson AI API",
    description="AI functionality for PeoplePerson - intent detection, person identification, and LLM workflows",
    version="1.0.0"
)

# CORS middleware for development
if ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include AI router
app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "PeoplePerson AI API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-api"}
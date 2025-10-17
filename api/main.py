from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import init_db
from routers import people, groups, history, associations, entries, auth, tags, health, sms
# TODO: Re-enable when migrating to Gemini
# from routers import ai

load_dotenv()

# API prefix constant
API_PREFIX = "/api"

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="PeoplePerson API",
    description="API for managing people and their relationships",
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

# Health endpoints without prefix (for Cloud Run health checks)
app.include_router(health.router)

# API endpoints with prefix
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(people.router, prefix=f"{API_PREFIX}/people", tags=["people"])
app.include_router(tags.router, prefix=f"{API_PREFIX}/tags", tags=["tags"])
app.include_router(groups.router, prefix=f"{API_PREFIX}/groups", tags=["groups"])
app.include_router(history.router, prefix=f"{API_PREFIX}/history", tags=["history"])
app.include_router(associations.router, prefix=f"{API_PREFIX}/associations", tags=["associations"])
app.include_router(entries.router, prefix=f"{API_PREFIX}/entries", tags=["entries"])
app.include_router(sms.router, prefix=f"{API_PREFIX}", tags=["sms"])
# TODO: Re-enable when migrating to Gemini
# app.include_router(ai.router, prefix=f"{API_PREFIX}/ai", tags=["ai"])
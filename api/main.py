from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import init_db
from routers import people, groups, history, associations, entries, auth, ai, tags

load_dotenv()

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

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(associations.router, prefix="/api/associations", tags=["associations"])
app.include_router(entries.router, prefix="/api/entries", tags=["entries"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "PeoplePerson API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
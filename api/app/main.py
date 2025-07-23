from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.routers import ai, people

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up FastAPI application...")
    yield
    # Shutdown
    print("Shutting down FastAPI application...")

app = FastAPI(
    title="PeoplePerson AI API",
    description="AI-powered friend management API using LangGraph",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # SvelteKit dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(people.router, prefix="/api/people", tags=["people"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
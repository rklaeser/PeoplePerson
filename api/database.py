from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment (required)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)

def init_db():
    try:
        SQLModel.metadata.create_all(engine)
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("API will run but database operations will fail")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
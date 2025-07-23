import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Environment variables
DATABASE_URL = os.getenv("DB_URL")
# Fix postgres:// to postgresql:// for SQLAlchemy 2.0+
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Initialize OpenAI model
model = ChatOpenAI(
    api_key=OPENAI_API_KEY,
    model="gpt-4o",
    temperature=0
)
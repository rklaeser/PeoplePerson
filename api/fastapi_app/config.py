import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DJANGO_API_URL = os.getenv("DJANGO_API_URL", "http://localhost:8000")

# Initialize OpenAI model
model = ChatOpenAI(
    api_key=OPENAI_API_KEY,
    model="gpt-4o",
    temperature=0
)
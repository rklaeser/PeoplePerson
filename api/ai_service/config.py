import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Initialize the language model
model = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=os.getenv("OPENAI_API_KEY")
)
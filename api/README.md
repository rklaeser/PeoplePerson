# PeoplePerson FastAPI Backend

A modern, high-performance API built with FastAPI for managing people, relationships, and AI-powered interactions.

## Tech Stack

- **Framework**: FastAPI (Python 3.13+)
- **ORM**: SQLModel (SQLAlchemy)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Firebase Auth
- **AI/LLM**: LangChain with OpenAI
- **Real-time**: Server-Sent Events (SSE)

## Features

- 🚀 High-performance async API
- 📝 Auto-generated API documentation (Swagger/ReDoc)
- 🔐 Firebase authentication with Bearer tokens
- 🤖 AI-powered person management
- 💾 Flexible database support (PostgreSQL/SQLite)
- 🔄 Real-time updates via SSE

## Project Structure

```
api/
├── main.py              # FastAPI application entry point
├── database.py          # Database configuration
├── models.py            # SQLModel database models
├── routers/             # API endpoint routers
│   ├── auth.py         # Authentication endpoints
│   ├── people.py       # Person CRUD operations
│   ├── groups.py       # Group management
│   ├── history.py      # Change history tracking
│   ├── associations.py # Relationship management
│   ├── entries.py      # Journal entries
│   └── ai.py           # AI processing endpoints
├── ai_service/          # AI/LLM service components
│   ├── config.py       # AI configuration
│   ├── schemas/        # Pydantic schemas for AI
│   └── workflows/      # LangGraph workflows
└── run_fastapi.py      # Server startup script
```

## API Endpoints

### Core Resources
- `/api/people` - Person CRUD operations
- `/api/groups` - Group management
- `/api/history` - Change history
- `/api/associations` - Person-to-person relationships
- `/api/entries` - Journal entries

### Authentication
- `/api/auth/register` - User registration
- `/api/auth/me` - Current user info

### AI Processing
- `/api/ai/process` - Process text with AI (SSE streaming)
- `/api/ai/process-sync` - Synchronous AI processing

### Utility
- `/` - API info
- `/health` - Health check
- `/docs` - Swagger UI documentation
- `/redoc` - ReDoc documentation

## Setup

### 1. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file:

```env
# Database (optional - uses SQLite if not set)
DATABASE_URL=postgresql://user:password@localhost:5432/peopleperson

# OpenAI API Key (for AI features)
OPENAI_API_KEY=sk-your-api-key

# Firebase (optional - for authentication)
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json

# Server Settings
PORT=8000
HOST=0.0.0.0
RELOAD=true
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
python run_fastapi.py

# Or specify a custom port
PORT=8001 python run_fastapi.py

# Production mode
RELOAD=false uvicorn main:app --host 0.0.0.0 --port 8000
```

## Development

### Database

The API automatically uses SQLite for development if `DATABASE_URL` is not set. For production, use PostgreSQL:

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Testing the API

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/

# View interactive docs
open http://localhost:8000/docs
```

### Authentication

The API uses Firebase for authentication. To test authenticated endpoints:

1. Obtain a Firebase ID token
2. Include it in the Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" http://localhost:8000/api/people
```

For internal service communication, use the `X-User-ID` and `X-Internal-Key` headers.

## Docker Support

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

CMD ["python", "run_fastapi.py"]
```

Build and run:
```bash
docker build -t peopleperson-api .
docker run -p 8000:8000 peopleperson-api
```

## Performance

FastAPI provides:
- Async request handling
- Automatic request validation
- Response serialization
- Built-in performance monitoring

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Update API documentation for new endpoints
4. Write tests for new features

## License

[Your License Here]
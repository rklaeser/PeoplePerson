# PeoplePerson API Architecture

This directory contains two separate API services that work together:

## Django API (Port 8000)
- **Purpose**: CRUD operations, data persistence, authentication
- **Tech**: Django REST Framework, PostgreSQL
- **Endpoints**:
  - `/api/people/` - Person CRUD operations
  - `/api/groups/` - Group management
  - `/api/history/` - Change history
  - `/api/auth/` - Authentication endpoints

## FastAPI AI Service (Port 8001)
- **Purpose**: AI/LLM operations, intent detection, person identification
- **Tech**: FastAPI, LangChain, OpenAI
- **Endpoints**:
  - `/ai/route/` - Main AI processing endpoint with SSE streaming

## Architecture Benefits

1. **Separation of Concerns**:
   - Django handles all database operations and authentication
   - FastAPI focuses purely on AI processing

2. **Single Database**:
   - Both services share the same PostgreSQL database
   - Django manages all writes
   - FastAPI calls Django API for any data needs

3. **Authentication Flow**:
   - Firebase tokens are verified by Django
   - Django syncs users on first authentication
   - FastAPI validates tokens through Django's auth endpoints

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```
DB_URL=postgresql://user:password@localhost:5432/peopleperson
OPENAI_API_KEY=sk-your-api-key
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase credentials
```

4. Run database migrations (Django):
```bash
python manage.py migrate
```

## Running the Services

```bash
# Terminal 1: Django
python run_django.py

# Terminal 2: FastAPI
python run_fastapi.py
```

## Testing the APIs

Django API:
```bash
curl http://localhost:8000/api/people/
```

FastAPI AI:
```bash
curl -X POST http://localhost:8001/ai/route/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Who is John?"}'
```

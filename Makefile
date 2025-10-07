# PeoplePerson Development Commands

# Individual service startup commands
.PHONY: auth api frontend dev-info stop-all

# Start Firebase Auth emulator (Terminal 1)
auth:
	@echo "Starting Firebase Auth emulator..."
	@echo "Auth emulator: http://localhost:9099"
	@echo "Firebase UI: http://localhost:4000"
	@echo "Press Ctrl+C to stop"
	@echo ""
	firebase emulators:start --only auth

# Start API server (Terminal 2) 
api:
	@echo "Starting FastAPI server..."
	@echo "API server: http://localhost:8000"
	@echo "Press Ctrl+C to stop"
	@echo ""
	cd api && . venv/bin/activate && python run_fastapi.py

# Start frontend dev server (Terminal 3)
frontend:
	@echo "Starting React frontend..."
	@echo "Frontend: http://localhost:5173"
	@echo "Press Ctrl+C to stop"
	@echo ""
	cd frontend && npm run dev

# Show development setup instructions
dev-info:
	@echo "Development Setup Instructions:"
	@echo ""
	@echo "Open 3 terminal windows and run:"
	@echo "  Terminal 1: make auth      (Firebase Auth emulator)"
	@echo "  Terminal 2: make api       (FastAPI server)"
	@echo "  Terminal 3: make frontend  (React dev server)"
	@echo ""
	@echo "Services will be available at:"
	@echo "  - Frontend: http://localhost:5173"
	@echo "  - API: http://localhost:8000"
	@echo "  - Firebase Auth: http://localhost:9099"
	@echo "  - Firebase UI: http://localhost:4000"
	@echo ""
	@echo "Start services in order: auth → api → frontend"

stop-all:
	@echo "Stopping all services..."
	@pkill -f "firebase.*emulators" 2>/dev/null || true
	@pkill -f "uvicorn.*main:app" 2>/dev/null || true
	@pkill -f "vite.*dev" 2>/dev/null || true
	@echo "All services stopped"

# Help command
help:
	@echo "Available commands:"
	@echo ""
	@echo "Quick start:"
	@echo "  make dev-info     - Show development setup instructions"
	@echo "  make auth         - Start Firebase Auth emulator (Terminal 1)"
	@echo "  make api          - Start FastAPI server (Terminal 2)"
	@echo "  make frontend     - Start React frontend (Terminal 3)"
	@echo "  make stop-all     - Stop all services"
	@echo ""
	@echo ""
	@echo "  make help         - Show this help message" 
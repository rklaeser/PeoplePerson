# PeoplePerson Development Commands

.PHONY: help sql api auth web webclient twilio clean test db-sync db-seed start-all

# Default target
help:
	@echo "Local development options:"
	@echo ""
	@echo "  make sql        - Start Cloud SQL Proxy for database access"
	@echo "  make api        - Start the API server"
	@echo "  make auth       - Start authentication services"
	@echo "  make web        - Start the legacy web frontend (React)"
	@echo "  make webclient  - Start the modern web client (React + TanStack)"
	@echo "  make twilio     - Start Twilio dev phone for SMS testing"
	@echo "  make start-all  - Start all services in tmux session"
	@echo ""
	@echo "Other commands:"
	@echo "  make clean      - Remove node_modules and build artifacts"
	@echo "  make test       - Run all tests"
	@echo "  make db-sync    - Sync database schema"
	@echo "  make db-seed    - Seed database with initial data"

# ========================================
# Development Commands
# ========================================

# Start SvelteKit development server
start-dev:
	@echo "Setting up and starting SvelteKit development server..."
	@if [ ! -f .env ]; then \
		echo "⚠️  No .env file found"; \
		echo "📝 Copy .env.example to .env and configure:"; \
		echo "   cp .env.example .env"; \
		echo ""; \
		echo "Then:"; \
		echo "1. Start Cloud SQL proxy: make start-sql"; \
		echo "2. Get DB password: gcloud secrets versions access latest --secret=\"database-password\" --project=peopleperson-app"; \
		echo "3. Update DB_URL in .env with the password"; \
		exit 1; \
	fi
	npm install
	@echo "Starting SvelteKit development server on http://localhost:5173"
	@echo "Press Ctrl+C to stop the server"
	npm run dev

# Start Cloud SQL Proxy for database access
sql:
	@echo "🔌 Starting Cloud SQL Proxy for database access..."
	@echo "📍 Connecting to: peopleperson-app:us-central1:peopleperson-db"
	@echo "🔗 Local port: 5432 (default PostgreSQL port)"
	@echo ""
	@echo "Available databases:"
	@echo "  - peopleperson (main application database)"
	@echo ""
	@echo "Connection example:"
	@echo "  psql \"postgresql://postgres:<password>@localhost:5432/peopleperson\""
	@echo ""
	@echo "Get the password with:"
	@echo "  gcloud secrets versions access latest --secret=\"database-password\" --project=peopleperson-app"
	@echo ""
	@echo "Press Ctrl+C to stop the proxy"
	@echo "----------------------------------------"
	cloud-sql-proxy peopleperson-app:us-central1:peopleperson-db --port 5432 --gcloud-auth

# Start the API server
api:
	@echo "🚀 Setting up and starting API server..."
	cd api && python3 -m venv venv || true
	cd api && source venv/bin/activate && pip install -r requirements.txt
	@echo "Starting API server on http://localhost:8000"
	@echo "Press Ctrl+C to stop the server"
	cd api && source venv/bin/activate && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start authentication services
auth:
	@echo "🔐 Starting Firebase Authentication Emulator..."
	@echo "📍 Running on: http://localhost:9099"
	@echo "🎛️  Emulator UI available at: http://localhost:4000"
	@echo ""
	@echo "Press Ctrl+C to stop the emulator"
	@echo "----------------------------------------"
	firebase emulators:start --only auth --import .firebase/emulator-data --export-on-exit

# Start the legacy web frontend
web:
	@echo "🌐 Starting legacy web frontend..."
	cd frontend && npm install && npm run dev

# Start the modern web client
webclient:
	@echo "🚀 Starting modern web client..."
	cd webclient && npm install && npm run dev

# Start Twilio dev phone for SMS testing
twilio:
	@echo "📱 Starting Twilio dev phone for SMS testing..."
	@echo "🌐 Dev phone will open at: http://localhost:1337"
	@echo "📞 Using Twilio number: +19167354096"
	@echo ""
	@echo "💡 Use this to test SMS without needing regulatory verification"
	@echo "   - Send SMS from your app and see them in the dev phone"
	@echo "   - Send test messages back to your app from the dev phone"
	@echo ""
	@echo "Press Ctrl+C to stop the dev phone"
	@echo "----------------------------------------"
	twilio dev-phone

# Start all services in tmux
start-all:
	@echo "🚀 Starting all services in tmux session 'peopleperson'..."
	@tmux new-session -d -s peopleperson -n api 'make api'
	@tmux new-window -t peopleperson -n auth 'make auth'
	@tmux new-window -t peopleperson -n webclient 'make webclient'
	@tmux new-window -t peopleperson -n twilio 'make twilio'
	@tmux new-window -t peopleperson -n sql 'make sql'
	@echo "✅ All services started in tmux session 'peopleperson'"
	@echo ""
	@echo "To attach to the session:"
	@echo "  tmux attach-session -t peopleperson"
	@echo ""
	@echo "To kill the session:"
	@echo "  tmux kill-session -t peopleperson"

# Clean up
clean:
	@echo "Cleaning up node_modules and build artifacts..."
	rm -rf node_modules
	rm -rf .svelte-kit
	rm -rf build
	@echo "Cleanup complete!"

# ========================================
# Testing Commands
# ========================================

# Run all tests
test:
	@echo "Running all tests..."
	npm test

# ========================================
# Database Commands
# ========================================

# Sync database schema
db-sync:
	@echo "Syncing database schema..."
	npm run db:sync

# Seed database with initial data
db-seed:
	@echo "Seeding database with initial data..."
	cd api && source venv/bin/activate && python3 seed_data.py 
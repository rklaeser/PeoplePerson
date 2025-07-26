# PostgreSQL Docker container management

# Variables
DB_NAME ?= peopleperson
DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_PORT ?= 5432
CONTAINER_NAME ?= peopleperson
DB_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@localhost:$(DB_PORT)/$(DB_NAME)

.PHONY: db-start db-stop db-restart db-logs db-ps db-clean db-url db-sync db-seed

# Start the database container
db-start:
	docker run --name $(CONTAINER_NAME) \
		-e POSTGRES_DB=$(DB_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-p $(DB_PORT):5432 \
		-d postgres:16

# Stop the database container
db-stop:
	docker stop $(CONTAINER_NAME) || true

# Restart the database container
db-restart: db-stop db-start

# View database container logs
db-logs:
	docker logs -f $(CONTAINER_NAME)

# List running containers
db-ps:
	docker ps -a | grep $(CONTAINER_NAME)

# Remove the database container and its volumes
db-clean:
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker volume prune -f

# Show database URL
db-url:
	@echo "Database URL: $(DB_URL)"
	@echo "Add this to your .env file:"
	@echo "DB_URL=$(DB_URL)"

# Sync database schema with Django
db-sync:
	cd api && . venv/bin/activate && python manage.py makemigrations --noinput
	cd api && . venv/bin/activate && python manage.py migrate

# Create Django superuser (optional)
db-superuser:
	cd api && . venv/bin/activate && python manage.py createsuperuser

# Seed database with initial data
db-seed:
	cd api && . venv/bin/activate && python manage.py seed_db

# Initialize database (start, sync schema, and seed data)
db-init: db-start
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Syncing database schema..."
	@make db-sync
	@echo "Seeding database..."
	@make db-seed

# Django commands
.PHONY: django-run django-migrate django-makemigrations

django-run:
	@echo "Running Django server..."
	cd api && . venv/bin/activate && python run_django.py

django-migrate:
	@echo "Running Django migrations..."
	cd api && . venv/bin/activate && python manage.py migrate

django-makemigrations:
	@echo "Creating Django migrations..."
	cd api && . venv/bin/activate && python manage.py makemigrations

# Firebase Emulator commands
.PHONY: firebase-start firebase-stop firebase-ui

firebase-start:
	@echo "Starting Firebase emulators..."
	firebase emulators:start --only auth

firebase-stop:
	@echo "Stopping Firebase emulators..."
	pkill -f "firebase.*emulators" || true

firebase-ui:
	@echo "Firebase Emulator UI available at: http://localhost:4000"
	@echo "Firebase Auth Emulator at: http://localhost:9099"

# Start all services in tmux session
.PHONY: start-all stop-all

start-all:
	@echo "Starting all services in tmux session 'peopleperson'..."
	@tmux has-session -t peopleperson 2>/dev/null && (echo "Session 'peopleperson' already exists. Run 'make stop-all' first." && exit 1) || true
	@echo "1. Creating tmux session and starting Firebase first..."
	@tmux new-session -d -s peopleperson -n firebase 'firebase emulators:start --only auth'
	@echo "Waiting for Firebase to be ready..."
	@sleep 8
	@echo "2. Cleaning up any existing containers..."
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker-compose down -v
	@echo "3. Starting Docker services (PostgreSQL, Redis, Celery)..."
	@docker-compose up -d
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "4. Setting up database..."
	@make db-sync
	@make db-seed
	@echo "5. Starting remaining services in tmux..."
	@tmux split-window -t peopleperson:0 -h 'docker-compose logs -f'
	@tmux split-window -t peopleperson:0 -h 'npm run dev'
	@tmux select-layout -t peopleperson:0 even-horizontal
	@tmux select-pane -t peopleperson:0.0
	@tmux split-window -t peopleperson:0 -v 'cd api && . venv/bin/activate && python run_django.py'
	@tmux select-pane -t peopleperson:0.1
	@tmux select-pane -t peopleperson:0.2
	@tmux split-window -t peopleperson:0 -v 'echo "Frontend output above"'
	@tmux select-layout -t peopleperson:0 tiled
	@echo ""
	@echo "All services started in tmux session 'peopleperson'!"
	@echo ""
	@echo "Services available at:"
	@echo "- Frontend: http://localhost:5173"
	@echo "- Django API: http://localhost:8000"
	@echo "- Firebase Auth: http://localhost:9099"
	@echo "- Firebase UI: http://localhost:4000"
	@echo ""
	@echo "To view services: tmux attach -t peopleperson"
	@echo "To detach: Ctrl+B then D"
	@echo "To stop all: make stop-all"

stop-all:
	@echo "Stopping all services..."
	@tmux kill-session -t peopleperson 2>/dev/null || true
	@docker-compose down -v
	@echo "All services stopped"

# Help command
help:
	@echo "Available commands:"
	@echo ""
	@echo "Quick start:"
	@echo "  make start-all    - Start all services in tmux session"
	@echo "  make stop-all     - Stop all services and tmux session"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-start     - Start the PostgreSQL container"
	@echo "  make db-stop      - Stop the PostgreSQL container"
	@echo "  make db-restart   - Restart the PostgreSQL container"
	@echo "  make db-logs      - View container logs"
	@echo "  make db-ps        - List running containers"
	@echo "  make db-clean     - Remove container and volumes"
	@echo "  make db-url       - Show database URL for .env file"
	@echo "  make db-sync      - Sync database schema"
	@echo "  make db-seed      - Seed database with initial data"
	@echo "  make db-init      - Initialize database (start, sync, and seed)"
	@echo ""
	@echo "Django commands:"
	@echo "  make django-run   - Run Django CRUD server (port 8000)"
	@echo "  make django-migrate - Run Django database migrations"
	@echo "  make django-makemigrations - Create new Django migrations"
	@echo ""
	@echo "Firebase commands:"
	@echo "  make firebase-start - Start Firebase Auth emulator (port 9099)"
	@echo "  make firebase-stop  - Stop Firebase emulators"
	@echo "  make firebase-ui    - Show Firebase emulator URLs"
	@echo ""
	@echo "  make help         - Show this help message" 
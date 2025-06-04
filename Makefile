# PostgreSQL Docker container management

# Variables
DB_NAME ?= friendship
DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_PORT ?= 5432
CONTAINER_NAME ?= friendship-db
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
	docker rm -f $(CONTAINER_NAME) || true
	docker volume prune -f

# Show database URL
db-url:
	@echo "Database URL: $(DB_URL)"
	@echo "Add this to your .env file:"
	@echo "DB_URL=$(DB_URL)"

# Sync database schema
db-sync:
	tsx ./src/lib/db/sync.ts

# Seed database with initial data
db-seed:
	tsx ./src/lib/db/seed.ts

# Initialize database (start, sync schema, and seed data)
db-init: db-start
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Syncing database schema..."
	@make db-sync
	@echo "Seeding database..."
	@make db-seed

# Help command
help:
	@echo "Available commands:"
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
	@echo "  make help         - Show this help message" 
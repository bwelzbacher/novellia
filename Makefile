.PHONY: up down build logs restart seed migrate test test-frontend lint clean ps

up: ## Build (if needed) and start the database + backend + frontend
	docker compose up --build -d

down: ## Stop and remove containers
	docker compose down

build: ## Rebuild the backend and frontend images
	docker compose build

logs: ## Tail logs from all services
	docker compose logs -f

restart: down up ## Restart everything

ps: ## Show running services
	docker compose ps

seed: ## Populate the database with sample pets/medical records
	docker compose exec backend npm run seed

migrate: ## Re-apply pending Prisma migrations without a rebuild
	docker compose exec backend npx prisma migrate deploy

test: ## Run backend unit tests (no Docker/DB required)
	cd backend && npm install && npm test

test-frontend: ## Run frontend unit tests (requires Node 22+)
	cd frontend && npm install && npm test -- --watch=false

lint: ## Lint the backend
	cd backend && npm install && npm run lint

clean: ## Stop containers and delete the database volume
	docker compose down -v

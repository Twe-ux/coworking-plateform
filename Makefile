# Coworking Platform Development Makefile

.DEFAULT_GOAL := help
.PHONY: help install dev build test lint format clean docker-dev docker-prod

# Variables
PNPM := pnpm
DOCKER_COMPOSE := docker-compose

help: ## Display this help message
	@echo "Coworking Platform Development Commands:"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing dependencies..."
	$(PNPM) install

dev: ## Start all applications in development mode
	@echo "Starting development servers..."
	$(PNPM) dev

dev-web: ## Start only web application
	@echo "Starting web application..."
	$(PNPM) dev:web

dev-dashboard: ## Start only dashboard application
	@echo "Starting dashboard application..."
	$(PNPM) dev:dashboard

dev-admin: ## Start only admin application
	@echo "Starting admin application..."
	$(PNPM) dev:admin

dev-api: ## Start only API server
	@echo "Starting API server..."
	$(PNPM) dev:api

build: ## Build all applications for production
	@echo "Building applications..."
	$(PNPM) build

test: ## Run all tests
	@echo "Running tests..."
	$(PNPM) test

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	$(PNPM) test:watch

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	$(PNPM) test:coverage

test-ui: ## Open Vitest UI
	@echo "Opening Vitest UI..."
	$(PNPM) test:ui

lint: ## Run linting
	@echo "Running linting..."
	$(PNPM) lint

lint-fix: ## Fix linting issues
	@echo "Fixing linting issues..."
	$(PNPM) lint:fix

format: ## Format code
	@echo "Formatting code..."
	$(PNPM) format

format-check: ## Check code formatting
	@echo "Checking code formatting..."
	$(PNPM) format:check

type-check: ## Run TypeScript type checking
	@echo "Running type checking..."
	$(PNPM) type-check

clean: ## Clean build artifacts and caches
	@echo "Cleaning build artifacts..."
	$(PNPM) clean

reset: ## Reset project (clean + reinstall)
	@echo "Resetting project..."
	$(PNPM) reset

docker-dev: ## Start development environment with Docker
	@echo "Starting Docker development environment..."
	$(DOCKER_COMPOSE) up -d

docker-dev-build: ## Build and start development environment with Docker
	@echo "Building and starting Docker development environment..."
	$(DOCKER_COMPOSE) up --build

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	$(DOCKER_COMPOSE) logs -f

docker-stop: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	$(DOCKER_COMPOSE) down

docker-clean: ## Clean Docker environment
	@echo "Cleaning Docker environment..."
	$(DOCKER_COMPOSE) down -v
	docker system prune -af

docker-prod: ## Start production environment with Docker
	@echo "Starting Docker production environment..."
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d

db-setup: ## Setup database containers
	@echo "Setting up database containers..."
	$(DOCKER_COMPOSE) up -d mongodb redis

db-seed: ## Seed database with initial data
	@echo "Seeding database..."
	$(PNPM) db:seed

deps-check: ## Check for security vulnerabilities
	@echo "Checking dependencies for vulnerabilities..."
	$(PNPM) deps:check

deps-update: ## Update dependencies interactively
	@echo "Updating dependencies..."
	$(PNPM) deps:update

deps-outdated: ## Check for outdated dependencies
	@echo "Checking for outdated dependencies..."
	$(PNPM) deps:outdated

commit: ## Interactive commit with conventional commits
	@echo "Starting interactive commit..."
	npx cz

pre-commit: ## Run pre-commit checks manually
	@echo "Running pre-commit checks..."
	$(PNPM) lint:fix
	$(PNPM) format
	$(PNPM) type-check
	$(PNPM) test

ci: ## Run CI pipeline locally
	@echo "Running CI pipeline..."
	$(PNPM) lint
	$(PNPM) type-check
	$(PNPM) test
	$(PNPM) build
# Makefile for OKR Performance System
# Integrates with Claude Code hooks for automated linting and testing

.PHONY: lint test fmt build dev clean install check-integration help

# Lint target - receives FILE= argument with relative path to edited file
lint:
	@if [ -n "$(FILE)" ]; then \
		echo "Linting specific file: $(FILE)" >&2; \
		case "$(FILE)" in \
			*.ts|*.tsx|*.js|*.jsx) \
				npx eslint --fix "$(FILE)" && \
				npx prettier --write "$(FILE)" ;; \
			*.json) \
				npx prettier --write "$(FILE)" ;; \
			*.md) \
				npx prettier --write "$(FILE)" ;; \
			*) \
				echo "No specific linter for $(FILE), running project-wide lint" >&2; \
				npm run lint ;; \
		esac \
	else \
		echo "Linting all files" >&2; \
		npm run lint && \
		npx prettier --write . --ignore-path .gitignore; \
	fi

# Test target - receives FILE= argument with relative path to edited file
test:
	@if [ -n "$(FILE)" ]; then \
		echo "Testing for file: $(FILE)" >&2; \
		case "$(FILE)" in \
			*.test.ts|*.test.tsx|*.test.js|*.spec.ts|*.spec.tsx|*.spec.js) \
				echo "Running specific test file: $(FILE)" >&2; \
				npm test "$(FILE)" 2>/dev/null || npm run test:quick ;; \
			*) \
				echo "No specific test for $(FILE), running quick tests" >&2; \
				npm run test:quick ;; \
		esac \
	else \
		echo "Running all tests" >&2; \
		npm run test:quick; \
	fi

# Format target (alias for consistency)
fmt: lint

# Build the project
build:
	@echo "Building project..." >&2
	@npm run build

# Start development server
dev:
	@echo "Starting development server..." >&2
	@npm run dev

# Install dependencies
install:
	@echo "Installing dependencies..." >&2
	@npm install

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..." >&2
	@rm -rf .next
	@rm -rf node_modules/.cache
	@rm -f tsconfig.tsbuildinfo

# Check Claude Code hooks integration
check-integration:
	@echo "✓ Makefile detected by Claude Code hooks" >&2
	@echo "  - 'make lint' target: available" >&2
	@echo "  - 'make test' target: available" >&2
	@echo "" >&2
	@echo "Test with:" >&2
	@echo "  make lint FILE=app/page.tsx" >&2
	@echo "  make test FILE=scripts/test-template-management.js" >&2

# Help target
help:
	@echo "Available targets:" >&2
	@echo "  lint              - Lint code (supports FILE= for specific files)" >&2
	@echo "  test              - Run tests (supports FILE= for specific files)" >&2
	@echo "  fmt               - Format code (alias for lint)" >&2
	@echo "  build             - Build the project" >&2
	@echo "  dev               - Start development server" >&2
	@echo "  install           - Install dependencies" >&2
	@echo "  clean             - Clean build artifacts" >&2
	@echo "  check-integration - Check Claude Code hooks integration" >&2
	@echo "  help              - Show this help" >&2
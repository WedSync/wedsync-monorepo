# Suggested Commands - WedSync AI

## Development Commands

### Root Level (Monorepo)
```bash
# Start all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Run linting across all packages
pnpm lint

# Run tests across all packages
pnpm test

# Run type checking across all packages
pnpm type-check

# Clean all build artifacts
pnpm clean
```

### Individual App Commands
```bash
# WedSync app
cd wedsync
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler check

# WedMe app
cd wedme
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check

# Admin app
cd admin
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check
```

### Package Development
```bash
# Database package
cd packages/database
pnpm build                    # Compile TypeScript
pnpm dev                      # Watch mode
pnpm db:generate-types        # Generate Supabase types
pnpm db:reset                 # Reset Supabase database
pnpm db:migrate               # Run migrations
pnpm db:seed                  # Seed database

# Other packages (types, utils, ui)
cd packages/[package-name]
pnpm build       # Compile TypeScript
pnpm dev         # Watch mode
pnpm type-check  # Type checking
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la           # List files with details
find . -name     # Find files by name
grep -r          # Search text in files

# Git operations
git status
git add .
git commit -m "message"
git push
git pull

# Process management
ps aux           # List running processes
kill -9 <pid>    # Force kill process
```

## Task Commands
Current task system tracks 115 tasks (T001-T115) from specs/001-wedsync-wedme-comprehensive/tasks.md
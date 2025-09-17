# WedSync AI - Project Overview

## Purpose
WedSync AI is a comprehensive wedding platform consisting of three interconnected applications:
- **WedSync**: Supplier platform for wedding vendors
- **WedMe**: Couple platform for wedding planning
- **Admin**: Administrative dashboard for platform management

The platform enables AI-powered wedding planning, vendor collaboration, and guest management with real-time synchronization between all apps.

## Tech Stack
- **Framework**: Next.js 14+ with React 18
- **Language**: TypeScript 5.0+
- **Database**: Supabase (PostgreSQL with real-time features)
- **Styling**: Tailwind CSS with design system tokens
- **Monorepo**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm 8.6.12+
- **Node**: >=18
- **UI Components**: Untitled UI + Magic UI (planned)

## Monorepo Structure
```
/
├── wedsync/                    # Supplier platform Next.js app
├── wedme/                      # Couple platform Next.js app  
├── admin/                      # Admin dashboard Next.js app
├── packages/
│   ├── ui/                     # Shared UI components (@wedsync/ui)
│   ├── types/                  # TypeScript definitions (@wedsync/types)
│   ├── utils/                  # Utilities (@wedsync/utils)
│   └── database/               # DB schemas (@wedsync/database)
├── specs/                      # Project specifications and tasks
└── docs/                       # Documentation (planned)
```

## Current Status
- Initial monorepo setup complete with Turborepo + pnpm
- Basic Next.js apps scaffolded for wedsync, wedme, admin
- Shared packages initialized with basic structure
- Task T009 (TypeScript project references) in progress
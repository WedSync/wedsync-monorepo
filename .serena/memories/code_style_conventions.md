# Code Style & Conventions - WedSync AI

## TypeScript Configuration
- **Target**: ES2020 for packages, ES5 for Next.js apps
- **Module**: CommonJS for packages, ESNext for Next.js apps
- **Strict Mode**: Enabled across all projects
- **Declaration**: Required for shared packages
- **Declaration Maps**: Enabled for debugging

## File Structure Conventions
- **Apps**: `/src/app/` for Next.js 14 app router
- **Components**: `/src/components/` for React components
- **Packages**: `/src/` for main source code, `/dist/` for compiled output
- **Types**: Centralized in `@wedsync/types` package

## Import Conventions
```typescript
// Package imports
import { SomeType } from '@wedsync/types'
import { SomeUtil } from '@wedsync/utils'
import { SomeComponent } from '@wedsync/ui'
import { supabase } from '@wedsync/database'

// Relative imports
import { Component } from '@/components/Component'
import { utils } from '@/lib/utils'
```

## Path Aliases
All apps use consistent path mapping:
```json
{
  "@/*": ["./src/*"],
  "@wedsync/ui": ["../packages/ui/src"],
  "@wedsync/types": ["../packages/types/src"],
  "@wedsync/utils": ["../packages/utils/src"],
  "@wedsync/database": ["../packages/database/src"]
}
```

## Package Naming
- All packages prefixed with `@wedsync/`
- Workspace dependencies use `workspace:*`
- Private packages (access: restricted)

## Development Standards
- ESLint + Prettier configuration (to be configured in T010)
- SonarQube CE for code quality (planned)
- Tailwind CSS for styling
- Test-driven development (TDD) approach required
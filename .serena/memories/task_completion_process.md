# Task Completion Process - WedSync AI

## When a Task is Completed

### 1. Code Quality Checks
```bash
# Run from monorepo root
pnpm lint        # ESLint check
pnpm type-check  # TypeScript compilation check
pnpm test        # Run all tests (when available)
```

### 2. Build Verification
```bash
# Ensure everything builds successfully
pnpm build
```

### 3. Git Workflow
```bash
# Check status and stage changes
git status
git add .

# Commit with descriptive message
git commit -m "feat: implement [task description] - T[number]"

# Push to remote (when ready)
git push
```

### 4. Task Dependencies
- Review task dependencies in specs/001-wedsync-wedme-comprehensive/tasks.md
- Ensure prerequisite tasks are complete
- Mark current task as complete in tracking system
- Identify next parallel or sequential tasks

### 5. Documentation Updates
- Update relevant memory files if architecture changes
- Add API documentation for new endpoints
- Update component documentation for UI changes

## Current Task Flow
- **Foundation**: T001-T012 (Setup) must complete before implementation
- **TDD Approach**: T026-T054 (Tests) must FAIL before T055+ (Implementation)
- **Parallel Execution**: Tasks marked [P] can run simultaneously
- **Critical Path**: Database → Tests → Shared Packages → Apps

## Quality Gates
- All TypeScript must compile without errors
- ESLint must pass (when configured)
- Tests must pass (when available)
- Build must succeed across all packages
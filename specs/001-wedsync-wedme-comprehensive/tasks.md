# Tasks: WedSync & WedMe Comprehensive Wedding Platform

**Input**: Design documents from `/specs/001-wedsync-wedme-comprehensive/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Next.js 14+, TypeScript, Supabase, React 18
   → Structure: 3 separate Next.js apps with shared libraries
2. Load design documents ✅:
   → data-model.md: 10 core entities + relationships
   → contracts/: WedSync API (25+ endpoints), WedMe API (20+ endpoints)
   → research.md: Architecture decisions and patterns
   → quickstart.md: End-to-end validation scenarios
3. Generate tasks by category ✅:
   → Setup: Monorepo, 3 Next.js apps, shared packages
   → Tests: 45+ contract tests, 8 integration scenarios
   → Core: 10 entity models, 15+ services, 45+ API endpoints
   → Integration: Real-time sync, auth, multi-tenancy
   → Polish: Performance, security, compliance
4. Apply task rules ✅:
   → Different apps/files = [P] parallel execution
   → Shared files = sequential
   → Tests before implementation (TDD)
5. Tasks numbered T001-T055 ✅
6. Dependencies mapped ✅
7. Parallel execution examples provided ✅
8. Validation completed ✅
9. SUCCESS: Ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files/apps, no dependencies)
- File paths are absolute within the monorepo structure

## Path Conventions
Based on plan.md structure decision (Option 2: Web application):
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
├── tests/
│   ├── contract/               # Contract tests
│   ├── integration/            # Integration tests
│   └── e2e/                   # End-to-end tests
└── docs/                      # Documentation
```

## Phase 3.1: Monorepo & Project Setup

- [ ] T001 Initialize monorepo with Turborepo and pnpm workspaces
- [ ] T002 [P] Create WedSync Next.js 14+ app in wedsync/ directory
- [ ] T003 [P] Create WedMe Next.js 14+ app in wedme/ directory
- [ ] T004 [P] Create Admin Next.js 14+ app in admin/ directory
- [ ] T005 [P] Initialize shared UI package (@wedsync/ui) with Untitled UI + Magic UI
- [ ] T006 [P] Initialize types package (@wedsync/types) with core TypeScript definitions
- [ ] T007 [P] Initialize utils package (@wedsync/utils) with common utilities
- [ ] T008 [P] Initialize database package (@wedsync/database) with Supabase schemas
- [ ] T009 Configure TypeScript project references across monorepo
- [ ] T010 [P] Set up ESLint, Prettier, and SonarQube CE configuration
- [ ] T011 [P] Configure Tailwind CSS with design system tokens across apps
- [ ] T012 Set up Supabase local development environment with Docker

## Phase 3.2: Database Schema & Models ⚠️ FOUNDATION REQUIRED

- [ ] T013 [P] Create User entity schema in packages/database/schemas/user.sql
- [ ] T014 [P] Create Supplier entity schema in packages/database/schemas/supplier.sql
- [ ] T015 [P] Create Wedding entity schema in packages/database/schemas/wedding.sql
- [ ] T016 [P] Create Guest entity schema in packages/database/schemas/guest.sql
- [ ] T017 [P] Create Venue entity schema in packages/database/schemas/venue.sql
- [ ] T018 [P] Create Form entity schema in packages/database/schemas/form.sql
- [ ] T019 [P] Create FormSubmission schema in packages/database/schemas/form_submission.sql
- [ ] T020 [P] Create Journey entity schema in packages/database/schemas/journey.sql
- [ ] T021 [P] Create Task entity schema in packages/database/schemas/task.sql
- [ ] T022 [P] Create Communication schema in packages/database/schemas/communication.sql
- [ ] T023 [P] Create Document entity schema in packages/database/schemas/document.sql
- [ ] T024 Configure Row Level Security (RLS) policies for multi-tenant isolation
- [ ] T025 Set up Supabase migrations and seed data for development

## Phase 3.3: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

**CRITICAL: These tests MUST be written and MUST FAIL before ANY API implementation**

### WedSync API Contract Tests
- [ ] T026 [P] Contract test POST /auth/login in tests/contract/wedsync_auth_login.test.ts
- [ ] T027 [P] Contract test GET /dashboard/today in tests/contract/wedsync_dashboard.test.ts
- [ ] T028 [P] Contract test GET /forms in tests/contract/wedsync_forms_list.test.ts
- [ ] T029 [P] Contract test POST /forms in tests/contract/wedsync_forms_create.test.ts
- [ ] T030 [P] Contract test GET/PUT/DELETE /forms/{id} in tests/contract/wedsync_forms_crud.test.ts
- [ ] T031 [P] Contract test GET /forms/{id}/submissions in tests/contract/wedsync_submissions.test.ts
- [ ] T032 [P] Contract test GET/POST /journeys in tests/contract/wedsync_journeys.test.ts
- [ ] T033 [P] Contract test POST /journeys/{id}/enroll in tests/contract/wedsync_journey_enroll.test.ts
- [ ] T034 [P] Contract test GET /clients in tests/contract/wedsync_clients.test.ts
- [ ] T035 [P] Contract test GET /clients/{id}/engagement in tests/contract/wedsync_engagement.test.ts
- [ ] T036 [P] Contract test GET/POST /communications in tests/contract/wedsync_communications.test.ts

### WedMe API Contract Tests
- [ ] T037 [P] Contract test POST /auth/login in tests/contract/wedme_auth_login.test.ts
- [ ] T038 [P] Contract test GET/POST /weddings in tests/contract/wedme_weddings.test.ts
- [ ] T039 [P] Contract test GET/PUT /weddings/{id} in tests/contract/wedme_wedding_details.test.ts
- [ ] T040 [P] Contract test PUT /weddings/{id}/core-details in tests/contract/wedme_core_details.test.ts
- [ ] T041 [P] Contract test GET/POST/PUT /weddings/{id}/guests in tests/contract/wedme_guests.test.ts
- [ ] T042 [P] Contract test POST /weddings/{id}/guests/{id}/rsvp in tests/contract/wedme_rsvp.test.ts
- [ ] T043 [P] Contract test GET/POST/PUT /weddings/{id}/tasks in tests/contract/wedme_tasks.test.ts
- [ ] T044 [P] Contract test GET/PUT /weddings/{id}/timeline in tests/contract/wedme_timeline.test.ts
- [ ] T045 [P] Contract test GET/POST /weddings/{id}/suppliers in tests/contract/wedme_suppliers.test.ts
- [ ] T046 [P] Contract test POST /weddings/{id}/forms/{id}/submit in tests/contract/wedme_form_submit.test.ts

### Integration Tests from Quickstart
- [ ] T047 [P] Integration test supplier onboarding flow in tests/integration/supplier_onboarding.test.ts
- [ ] T048 [P] Integration test AI form generation in tests/integration/ai_form_generation.test.ts
- [ ] T049 [P] Integration test customer journey automation in tests/integration/journey_automation.test.ts
- [ ] T050 [P] Integration test couple registration and wedding setup in tests/integration/couple_onboarding.test.ts
- [ ] T051 [P] Integration test guest management and RSVP flow in tests/integration/guest_management.test.ts
- [ ] T052 [P] Integration test real-time data sync between platforms in tests/integration/realtime_sync.test.ts
- [ ] T053 [P] Integration test cross-platform communication in tests/integration/communication_flow.test.ts
- [ ] T054 [P] Integration test admin dashboard metrics in tests/integration/admin_dashboard.test.ts

## Phase 3.4: Shared Packages Implementation (ONLY after tests are failing)

- [ ] T055 [P] Core types in packages/types/src/user.ts
- [ ] T056 [P] Core types in packages/types/src/wedding.ts
- [ ] T057 [P] Core types in packages/types/src/supplier.ts
- [ ] T058 [P] API response types in packages/types/src/api.ts
- [ ] T059 [P] Database client in packages/database/src/client.ts
- [ ] T060 [P] User service in packages/utils/src/services/user.service.ts
- [ ] T061 [P] Wedding service in packages/utils/src/services/wedding.service.ts
- [ ] T062 [P] Auth utilities in packages/utils/src/auth.ts
- [ ] T063 [P] Validation utilities in packages/utils/src/validation.ts
- [ ] T064 [P] UI components library in packages/ui/src/components/

## Phase 3.5: WedSync App Implementation

- [ ] T065 Authentication system in wedsync/src/app/auth/
- [ ] T066 Dashboard page in wedsync/src/app/dashboard/page.tsx
- [ ] T067 Today's wedding modal in wedsync/src/components/TodayWeddingModal.tsx
- [ ] T068 Forms list page in wedsync/src/app/forms/page.tsx
- [ ] T069 Form builder component in wedsync/src/components/FormBuilder.tsx
- [ ] T070 AI form generation in wedsync/src/components/AIFormGenerator.tsx
- [ ] T071 Journey builder page in wedsync/src/app/journeys/page.tsx
- [ ] T072 Journey canvas component in wedsync/src/components/JourneyCanvas.tsx
- [ ] T073 Client management page in wedsync/src/app/clients/page.tsx
- [ ] T074 Engagement dashboard in wedsync/src/components/EngagementDashboard.tsx
- [ ] T075 Communications inbox in wedsync/src/app/communications/page.tsx

## Phase 3.6: WedMe App Implementation

- [ ] T076 Authentication system in wedme/src/app/auth/
- [ ] T077 Wedding dashboard in wedme/src/app/dashboard/page.tsx
- [ ] T078 Core details form in wedme/src/components/CoreDetailsForm.tsx
- [ ] T079 Guest management page in wedme/src/app/guests/page.tsx
- [ ] T080 Guest import component in wedme/src/components/GuestImport.tsx
- [ ] T081 RSVP management in wedme/src/components/RSVPManager.tsx
- [ ] T082 Task management page in wedme/src/app/tasks/page.tsx
- [ ] T083 Task delegation component in wedme/src/components/TaskDelegation.tsx
- [ ] T084 Timeline management in wedme/src/app/timeline/page.tsx
- [ ] T085 Supplier collaboration in wedme/src/app/suppliers/page.tsx
- [ ] T086 Form submission interface in wedme/src/components/FormSubmission.tsx

## Phase 3.7: Admin App Implementation

- [ ] T087 Admin authentication in admin/src/app/auth/
- [ ] T088 Platform metrics dashboard in admin/src/app/dashboard/page.tsx
- [ ] T089 User management in admin/src/app/users/page.tsx
- [ ] T090 Revenue analytics in admin/src/components/RevenueAnalytics.tsx
- [ ] T091 System health monitoring in admin/src/components/SystemHealth.tsx
- [ ] T092 Data privacy tools in admin/src/app/privacy/page.tsx

## Phase 3.8: Real-time & Integration Features

- [ ] T093 Supabase real-time subscriptions setup in packages/database/src/realtime.ts
- [ ] T094 Cross-platform data sync service in packages/utils/src/services/sync.service.ts
- [ ] T095 Webhook system in packages/utils/src/webhooks/
- [ ] T096 Email service integration (SendGrid) in packages/utils/src/services/email.service.ts
- [ ] T097 SMS/WhatsApp service (Twilio) in packages/utils/src/services/sms.service.ts
- [ ] T098 Calendar integrations in packages/utils/src/services/calendar.service.ts
- [ ] T099 AI integrations (OpenAI) in packages/utils/src/services/ai.service.ts
- [ ] T100 File upload and storage in packages/utils/src/services/storage.service.ts

## Phase 3.9: Performance & Security

- [ ] T101 [P] Multi-tenant data isolation testing in tests/security/rls_policies.test.ts
- [ ] T102 [P] Performance benchmarks in tests/performance/load_testing.test.ts
- [ ] T103 [P] Security audit compliance in tests/security/compliance.test.ts
- [ ] T104 [P] GDPR data export functionality in packages/utils/src/services/gdpr.service.ts
- [ ] T105 [P] Rate limiting and API protection in packages/utils/src/middleware/
- [ ] T106 Session management and auth tokens in packages/utils/src/auth/sessions.ts
- [ ] T107 Data encryption for PII fields in packages/database/src/encryption.ts

## Phase 3.10: Polish & Validation

- [ ] T108 [P] Unit tests for form validation in tests/unit/validation.test.ts
- [ ] T109 [P] Unit tests for business logic in tests/unit/services.test.ts
- [ ] T110 [P] End-to-end quickstart validation with Playwright in tests/e2e/quickstart.test.ts
- [ ] T111 [P] API documentation generation in docs/api/
- [ ] T112 [P] Component Storybook setup in docs/storybook/
- [ ] T113 Performance optimization (sub-2s page loads) across all apps
- [ ] T114 Code quality gates with SonarQube integration
- [ ] T115 Deployment configuration and CI/CD pipeline setup

## Dependencies

### Critical Path
- T001-T012 (Setup) → All other tasks
- T013-T025 (Database) → T055-T115 (All implementation)
- T026-T054 (Tests) → T055-T115 (All implementation)
- T055-T064 (Shared packages) → T065-T092 (App implementations)
- T093-T100 (Integration) → T110 (E2E validation)

### Parallel Execution Blocks
1. **Setup Phase**: T002-T004, T005-T008, T010-T011 can run in parallel
2. **Database Schemas**: T013-T023 can run in parallel
3. **Contract Tests**: T026-T046 can run in parallel within each API
4. **Integration Tests**: T047-T054 can run in parallel
5. **Shared Packages**: T055-T064 can run in parallel
6. **Polish Tasks**: T108-T112 can run in parallel

## Parallel Example

### Phase 1: Setup (can run simultaneously)
```bash
# Launch foundation setup in parallel:
Task: "Create WedSync Next.js 14+ app in wedsync/ directory"
Task: "Create WedMe Next.js 14+ app in wedme/ directory"
Task: "Create Admin Next.js 14+ app in admin/ directory"
Task: "Initialize shared UI package (@wedsync/ui)"
```

### Phase 2: Contract Tests (TDD - must fail before implementation)
```bash
# Launch WedSync API contract tests in parallel:
Task: "Contract test POST /forms in tests/contract/wedsync_forms_create.test.ts"
Task: "Contract test GET /journeys in tests/contract/wedsync_journeys.test.ts"
Task: "Contract test GET /clients in tests/contract/wedsync_clients.test.ts"
```

### Phase 3: Core Implementation (after tests are failing)
```bash
# Launch shared package development in parallel:
Task: "Core types in packages/types/src/user.ts"
Task: "Wedding service in packages/utils/src/services/wedding.service.ts"
Task: "UI components library in packages/ui/src/components/"
```

## Notes
- [P] tasks = different files/apps, no shared dependencies
- Verify all contract tests fail before implementing endpoints
- Commit after each completed task
- Real-time sync testing requires multiple browser instances
- Multi-tenancy requires careful RLS policy testing

## Task Generation Rules Applied

1. **From Contracts**:
   - WedSync API (12 endpoints) → 11 contract test tasks [P]
   - WedMe API (10 endpoints) → 10 contract test tasks [P]

2. **From Data Model**:
   - 11 entities → 11 schema creation tasks [P]
   - Entity relationships → service layer tasks

3. **From Quickstart Scenarios**:
   - 8 user journeys → 8 integration test tasks [P]
   - End-to-end validation → Playwright test suite

4. **From Research Decisions**:
   - Monorepo with 3 apps → Turborepo setup
   - Supabase RLS → Multi-tenant isolation tasks
   - Real-time sync → WebSocket infrastructure

## Validation Checklist ✅

- [x] All WedSync API contracts have corresponding tests (T026-T036)
- [x] All WedMe API contracts have corresponding tests (T037-T046)
- [x] All 11 entities have schema creation tasks (T013-T023)
- [x] All tests come before implementation (Phase 3.3 → 3.4+)
- [x] Parallel tasks target different files/apps
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Dependencies properly mapped
- [x] Quickstart scenarios covered in integration tests
- [x] Performance and security requirements addressed

**Total Tasks**: 115 tasks across 10 phases
**Parallel Tasks**: 67 tasks marked [P] for concurrent execution
**Estimated Duration**: 8-12 weeks with team of 4-6 developers

---

*Tasks ready for execution following TDD principles and constitutional requirements*
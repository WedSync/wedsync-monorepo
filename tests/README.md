# WedSync & WedMe Test Suite

This directory contains the comprehensive test suite for the WedSync and WedMe wedding platform, following Test-Driven Development (TDD) principles.

## ✅ Completed Tasks (T026-T030)

### Contract Tests - WedSync API
- **T026**: `tests/contract/wedsync_auth_login.test.ts` - Authentication endpoint contract
- **T027**: `tests/contract/wedsync_dashboard.test.ts` - Dashboard today endpoint contract  
- **T028**: `tests/contract/wedsync_forms_list.test.ts` - Forms listing endpoint contract
- **T029**: `tests/contract/wedsync_forms_create.test.ts` - Form creation endpoint contract
- **T030**: `tests/contract/wedsync_forms_crud.test.ts` - Form CRUD operations contract

## Structure

```
tests/
├── package.json              # Test dependencies and scripts
├── jest.config.ts            # Jest configuration
├── jest.setup.ts             # Global test setup
├── contract/                 # Contract tests (API validation)
│   ├── helpers/
│   │   ├── api-client.ts     # HTTP client wrapper
│   │   └── fixtures.ts       # Test data fixtures
│   ├── wedsync_auth_login.test.ts
│   ├── wedsync_dashboard.test.ts
│   ├── wedsync_forms_list.test.ts
│   ├── wedsync_forms_create.test.ts
│   └── wedsync_forms_crud.test.ts
├── integration/              # Integration tests (planned)
└── e2e/                     # End-to-end tests (planned)
```

## Test Philosophy

These tests follow **Test-Driven Development (TDD)** principles:

1. **Tests MUST FAIL initially** - They are written against API contracts that don't exist yet
2. **Tests define the API contract** - They specify exactly how the API should behave
3. **Implementation follows tests** - Code is written to make these tests pass

## Key Features

### Contract Tests (T026-T030)
- ✅ **Authentication validation** - Login flow with JWT tokens
- ✅ **Dashboard data structure** - Today's wedding information
- ✅ **Forms CRUD operations** - Complete form lifecycle
- ✅ **Pagination & filtering** - List operations with proper pagination
- ✅ **Error handling** - Proper HTTP status codes and error formats
- ✅ **Authorization** - Supplier-specific data access
- ✅ **Performance requirements** - Response time validation
- ✅ **Security headers** - CORS and security header validation

### Test Coverage
Each test file includes comprehensive coverage of:
- **Happy path scenarios** - Valid inputs and expected outputs
- **Error scenarios** - Invalid inputs and proper error responses
- **Edge cases** - Boundary conditions and unusual inputs
- **Security** - Authentication, authorization, and data isolation
- **Performance** - Response time requirements
- **Data validation** - Schema compliance and business rules

## Running Tests

```bash
# Install dependencies
cd tests && npm install

# Run all tests
npm test

# Run specific test suite
npm run test:contract

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## API Client Helper

The `helpers/api-client.ts` provides a wrapper around supertest for making HTTP requests:

```typescript
const apiClient = new ApiClient();

// Basic requests
await apiClient.post('/auth/login', credentials);
await apiClient.get('/forms');

// Authenticated requests
await apiClient.withAuth(token).get('/dashboard/today');
await apiClient.withAuth(token).put('/forms/123', updateData);
```

## Test Fixtures

The `helpers/fixtures.ts` contains reusable test data:
- User and supplier mock objects
- Form schemas and validation data
- Authentication credentials
- Response templates

## Next Steps

After T026-T030, the remaining contract tests need to be implemented:
- T031-T036: Additional WedSync API endpoints
- T037-T046: WedMe API contract tests
- T047-T054: Integration test scenarios

## Important Notes

⚠️ **These tests WILL FAIL initially** - This is expected and correct behavior for TDD.

✅ **Tests should only pass after** the corresponding API endpoints are implemented.

🎯 **Goal**: These tests define the exact API contract that the implementation must satisfy.
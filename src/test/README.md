
# Testing Environment

This project has a comprehensive testing setup with unit tests, integration tests, and end-to-end tests.

## Test Structure

```
src/test/
├── components/          # Component unit tests
├── pages/              # Page component tests
├── hooks/              # Custom hook tests
├── utils/              # Utility function tests
├── integration/        # Integration tests
├── mocks/              # MSW mock handlers
├── fixtures/           # Test data fixtures
├── utils.tsx           # Test utilities and providers
├── rtl-helpers.ts      # Runtime Testing Library helpers
└── setup.ts            # Test setup and globals

e2e/                    # Playwright end-to-end tests
```

## Available Test Commands

To run these commands, you need to add them to your package.json scripts section:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Running Tests

- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run all unit tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI

## Test Coverage

The test suite covers:

### Components
- ✅ EventCard - Event display and registration
- ✅ RegistrationCard - Registration information display
- ✅ ProtectedRoute - Authentication and authorization

### Pages
- ✅ Auth - Sign in/up functionality
- ✅ Dashboard - User dashboard and registrations

### Hooks
- ✅ useUserRegistrations - Fetching user registrations
- ✅ Currency utilities - Price formatting

### Integration Tests
- ✅ Event registration flow
- ✅ Authentication flow
- ✅ User journey tests

### E2E Tests
- ✅ Complete user journeys
- ✅ Authentication flows
- ✅ Event browsing and registration

## Mock Data

The test environment uses MSW (Mock Service Worker) to intercept API calls and provide consistent test data. Mock handlers are defined in `src/test/mocks/handlers.ts`.

## Dev Environment Workaround

This project uses a runtime-only workaround for @testing-library/react imports due to TypeScript module resolution issues in hosted dev environments. The `rtl-helpers.ts` file provides the necessary testing utilities without relying on TypeScript's module resolution.

## Test Data

Reusable test fixtures are available in `src/test/fixtures/` for consistent test data across different test files.

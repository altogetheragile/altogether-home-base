
# Test Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@vitest/coverage-v8": "^3.2.2",
    "jsdom": "^26.1.0",
    "msw": "^2.10.1",
    "vitest": "^3.2.2"
  }
}
```

## Running Tests

- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run all unit tests once
- `npm run test:coverage` - Run tests with coverage report

## Note on Dev Environment

This project uses a runtime-only workaround for @testing-library/react imports due to TypeScript module resolution issues in hosted dev environments. The `rtl-helpers.ts` file provides the necessary testing utilities without relying on TypeScript's module resolution.

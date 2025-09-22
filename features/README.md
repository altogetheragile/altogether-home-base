# BDD Test Suite

This directory contains Behavior-Driven Development (BDD) tests using Cucumber and Playwright for the Knowledge Base Admin functionality.

## Structure

```
features/
├── knowledge-base/           # Feature files for knowledge base functionality
│   ├── content-management.feature
│   ├── content-studio-dashboard.feature
│   └── knowledge-item-editor.feature
└── support/                  # Test setup and configuration
    ├── world.ts             # Custom World class with Playwright integration
    └── hooks.ts             # Before/After hooks for test setup

steps/                        # Step definitions
├── auth-steps.ts            # Authentication-related steps
├── navigation-steps.ts      # Navigation and routing steps
├── knowledge-base-steps.ts  # Knowledge base specific steps
└── common-steps.ts          # Reusable common steps

pages/                        # Page Object Model classes
├── login-page.ts            # Login page interactions
├── admin-layout-page.ts     # Admin layout navigation
└── knowledge-base-page.ts   # Knowledge base page interactions

test-data/                    # Test fixtures and data
└── knowledge-items-fixtures.ts
```

## Running Tests

### Development Mode
```bash
npm run test:bdd:dev
```

### Smoke Tests Only
```bash
npm run test:bdd:smoke
```

### Debug Mode (with browser visible)
```bash
npm run test:bdd:debug
```

### CI Mode
```bash
npm run test:bdd:ci
```

## Writing New Tests

### 1. Feature Files
Write Gherkin scenarios in `.feature` files:

```gherkin
Feature: New Functionality
  As a user
  I want to do something
  So that I can achieve a goal

  Scenario: Basic functionality
    Given I am on the page
    When I perform an action
    Then I should see the result
```

### 2. Step Definitions
Implement step definitions in TypeScript:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';

Given('I am on the page', async function (this: CustomWorld) {
  await this.page.goto('/page');
});
```

### 3. Page Objects
Create page objects for reusable interactions:

```typescript
export class MyPage {
  constructor(private page: Page) {}
  
  async performAction() {
    await this.page.click('button');
  }
}
```

## Tags

Use tags to organize and filter tests:

- `@smoke` - Critical functionality tests
- `@crud` - Create, Read, Update, Delete operations
- `@search` - Search functionality
- `@filter` - Filtering functionality  
- `@bulk` - Bulk operations
- `@validation` - Form validation
- `@skip` - Tests to skip (excluded by default)

## Test Data

Test fixtures are defined in `test-data/knowledge-items-fixtures.ts`. Use these for consistent test data across scenarios.

## Reports

Tests generate HTML reports in `cucumber-report.html` with:
- Scenario results
- Step-by-step execution
- Screenshots on failures
- Execution timing

## Best Practices

1. **Keep scenarios focused** - One behavior per scenario
2. **Use meaningful names** - Scenarios should read like documentation
3. **Avoid UI-specific details** in feature files - Keep them business-focused
4. **Reuse step definitions** - Build a library of common steps
5. **Use Page Objects** - Encapsulate page interactions
6. **Clean test data** - Each scenario should be independent
7. **Tag appropriately** - Enable easy filtering and organization
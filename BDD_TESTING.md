# BDD Testing with Cucumber + Playwright

This project includes Behavior-Driven Development (BDD) tests using Cucumber.js with Playwright for end-to-end testing of the Knowledge Base admin functionality.

## 🏗️ Project Structure

```
├── features/                     # Gherkin feature files
│   ├── knowledge-base/
│   │   ├── content-management.feature
│   │   ├── content-studio-dashboard.feature
│   │   ├── knowledge-item-editor.feature
│   └── authentication/
│       └── admin-access.feature
├── steps/                        # Step definitions
│   ├── auth-steps.ts
│   ├── knowledge-base-steps.ts
│   ├── navigation-steps.ts
│   └── editor-steps.ts
├── pages/                        # Page Object Model
│   ├── login-page.ts
│   ├── knowledge-base-dashboard-page.ts
│   └── knowledge-item-editor-page.ts
├── support/                      # Test setup and utilities
│   ├── world.ts
│   └── hooks.ts
├── test-data/                    # Test fixtures and data
└── reports/                      # Generated test reports
```

## 🚀 Running BDD Tests

### Prerequisites
- All dependencies are already installed via npm
- The application server should be running on `http://localhost:5173`
- Test database should be set up with sample data

### Available Commands

```bash
# Run all BDD tests
npm run test:bdd

# Run tests with file watching (development)
npm run test:bdd:watch

# Run smoke tests only
npm run test:bdd:smoke

# Run tests with specific tags
npm run test:bdd:tags "@analytics"
npm run test:bdd:tags "@bulk-operations"

# Generate HTML report
npm run test:bdd:html

# Run tests in parallel
npm run test:bdd:parallel

# Run all test suites (unit + e2e + bdd smoke)
npm run test:all
```

## 🎯 Test Scenarios Covered

### Content Management (`content-management.feature`)
- ✅ Create new knowledge items with validation
- ✅ Edit existing knowledge items 
- ✅ Bulk delete operations
- ✅ Search and filter functionality

### Content Studio Dashboard (`content-studio-dashboard.feature`)
- ✅ Analytics and metrics display
- ✅ Dashboard view switching (Cards/Table/Board)
- ✅ Advanced filtering and search
- ✅ Bulk operations from dashboard

### Knowledge Item Editor (`knowledge-item-editor.feature`)
- ✅ Multi-step creation workflow
- ✅ Rich text editor functionality
- ✅ Template usage and customization
- ✅ Live preview features

### Authentication & Access Control (`admin-access.feature`)
- ✅ Admin login/logout flows
- ✅ Protected route access
- ✅ Unauthorized access prevention
- ✅ Session management

## 🏷️ Test Tags

Tests are organized with tags for selective execution:

- `@smoke` - Critical functionality tests
- `@analytics` - Dashboard analytics features  
- `@bulk-operations` - Bulk actions and operations
- `@editor-workflow` - Content creation and editing
- `@authentication` - Login/logout and access control

## 📊 Reports

After running tests, reports are generated in the `reports/` directory:

- `cucumber-report.html` - Interactive HTML report with screenshots
- `cucumber-report.json` - Machine-readable JSON report
- Screenshots on test failures in `screenshots/` directory

## 🔧 Configuration

The BDD tests are configured via `cucumber.config.js`:

- Uses TypeScript step definitions
- Parallel execution (2 workers)
- Automatic retry on failure
- Multiple output formats
- Integration with Playwright browser automation

## 🧪 Test Data

Test fixtures are available in `test-data/knowledge-items-fixtures.ts` and can be extended for additional test scenarios.

## 🐛 Debugging

- Tests run in headed mode locally for debugging
- Console logs and page errors are captured
- Screenshots taken automatically on test failures
- Use `test:bdd:watch` for iterative development

## 📝 Writing New Tests

1. **Add Feature File**: Create `.feature` file in appropriate directory
2. **Write Gherkin**: Use Given/When/Then syntax with business language
3. **Implement Steps**: Add step definitions in `steps/` directory  
4. **Update Page Objects**: Extend page objects as needed for new UI elements
5. **Add Test Data**: Include fixtures in `test-data/` if required

### Example Feature:
```gherkin
Feature: New Feature
  As a user
  I want to perform some action
  So that I can achieve some goal

  @smoke
  Scenario: Basic scenario
    Given I am on the relevant page
    When I perform an action
    Then I should see the expected result
```

## 🚦 CI/CD Integration

BDD smoke tests are integrated into the GitHub Actions workflow and run on every push/PR to ensure core functionality remains intact.

# Test Architecture Documentation

This document outlines the testing patterns and best practices for this project.

## Overview

Our test architecture uses:
- **Vitest** for test running and assertions
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** v2 for API mocking
- **Playwright** for end-to-end testing

## Project Structure

```
src/test/
├── components/          # Component unit tests
├── hooks/              # Hook unit tests  
├── integration/        # Integration tests
├── pages/              # Page component tests
├── utils/              # Utility function tests
├── fixtures/           # Mock data fixtures
├── mocks/              # MSW handlers and server setup
├── examples/           # Sample tests demonstrating patterns
├── setup.ts            # Global test setup
├── test-utils.tsx      # Custom testing utilities
└── README.md           # This documentation
```

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '../test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### Hook Tests

```typescript
import { renderHook } from '../test-utils'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe('expected')
  })
})
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { server } from '../mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Integration Test', () => {
  it('should handle full user flow', async () => {
    render(<MyPage />)
    
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

## Mock Data

### Using Fixtures

```typescript
import { mockEvent, createMockEvent } from '../fixtures/mockEventData'

// Use predefined mock
const event = mockEvent

// Create custom mock
const customEvent = createMockEvent({ title: 'Custom Event' })
```

### MSW Handlers

Handlers are automatically configured for common API endpoints. To add custom handlers:

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

// Add runtime handler
server.use(
  http.get('/api/custom', () => {
    return HttpResponse.json({ data: 'custom' })
  })
)
```

## Best Practices

1. **Use Descriptive Test Names**: Tests should clearly describe what they're testing
2. **Arrange, Act, Assert**: Structure tests with clear setup, action, and verification
3. **Test User Behavior**: Focus on testing what users see and do
4. **Mock External Dependencies**: Use MSW for API calls, mock complex dependencies
5. **Clean Up**: Ensure tests clean up after themselves
6. **Test Edge Cases**: Include error states, loading states, and boundary conditions

## Common Patterns

### Testing Loading States

```typescript
it('should show loading state', () => {
  render(<MyComponent />)
  expectLoadingState()
})
```

### Testing Error States  

```typescript
it('should handle errors', async () => {
  // Setup error scenario
  server.use(
    http.get('/api/data', () => HttpResponse.error())
  )
  
  render(<MyComponent />)
  
  await waitFor(() => {
    expectErrorState('Failed to load data')
  })
})
```

### Testing Authentication

```typescript
it('should work for authenticated users', () => {
  const authValue = { user: mockUser, loading: false }
  render(<MyComponent />, { authValue })
  
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in test configuration
2. **MSW handlers not working**: Check URL patterns and handler order
3. **React Query not updating**: Ensure proper cleanup between tests
4. **Authentication issues**: Verify mock auth context values

### Debug Tips

- Use `screen.debug()` to see current DOM
- Add `console.log()` in handlers to verify they're called
- Use `waitFor()` for async operations
- Check browser dev tools when using `test:ui`

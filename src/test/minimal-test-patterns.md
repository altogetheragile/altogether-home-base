# Minimal Test Patterns - Proof of Concept

This document captures the working test patterns established through our proof-of-concept tests.

## ✅ Working Pattern 1: Simple Component Test

**File**: `src/test/proof-of-concept.test.tsx`

**What Works**:
- Direct `render()` from `@testing-library/react`
- No complex context providers needed
- Simple assertions with `screen.getBy...`
- Testing static content and attributes

**Template**:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import MyComponent from '@/components/MyComponent'

describe('Simple Component Test', () => {
  it('renders basic content', () => {
    render(<MyComponent />)
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
```

## ✅ Working Pattern 2: Hook Test with QueryClient

**File**: `src/test/proof-of-concept-hook.test.tsx`

**What Works**:
- `renderHook()` with custom wrapper
- Direct `QueryClientProvider` wrapper (no complex abstractions)
- Proper Supabase client mocking
- `waitFor()` for async assertions

**Template**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false }
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('Hook Test', () => {
  it('works with QueryClient context', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: TestWrapper
    })
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })
})
```

## Key Principles That Work

1. **Start Simple**: Test components without context first
2. **Direct Wrappers**: Use `QueryClientProvider` directly, not complex abstractions
3. **Clear Mocking**: Mock at the integration boundary (Supabase client)
4. **Focused Tests**: One concern per test
5. **Proper Cleanup**: Use `vi.clearAllMocks()` in `beforeEach`

## Test Infrastructure Hierarchy

```
Simple Component Test (no context)
└── Hook Test (QueryClient context)
    └── Component with Router (Router + QueryClient)
        └── Component with Auth (Router + QueryClient + Auth)
```

## Next Steps

1. Verify these patterns work by running the tests
2. Use these as templates for expanding test coverage
3. Only add complexity when absolutely necessary
4. Document any deviations from these patterns
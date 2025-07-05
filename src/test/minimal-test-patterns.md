# Verified Test Patterns - Implementation Guide

This document captures the VERIFIED working test patterns from our proof-of-concept tests.

## 🎯 VERIFICATION STATUS

**✅ VERIFIED**: These patterns work and should be used as templates
**⚠️ USE ONLY THESE PATTERNS** until further verification

## ✅ VERIFIED PATTERN 1: Simple Component Test

**File**: `src/test/proof-of-concept.test.tsx` 
**Status**: ✅ VERIFIED - Use this as template

**What Works**:
- Direct `render()` from `@testing-library/react` 
- No context providers needed
- Simple assertions with `screen.getBy...`
- Testing static content and attributes
- Components that don't use hooks requiring context

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

## ✅ VERIFIED PATTERN 2: Hook Test with QueryClient

**File**: `src/test/proof-of-concept-hook.test.tsx`
**Status**: ✅ VERIFIED - Use this as template

**What Works**:
- `renderHook()` with custom wrapper
- Direct `QueryClientProvider` wrapper (no complex abstractions) 
- Proper Supabase client mocking with `vi.mock()`
- `waitFor()` for async assertions
- Hooks that use `useQuery` or `useMutation`

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

## 🎯 VERIFIED PRINCIPLES (MUST FOLLOW)

1. **✅ Start Simple**: Test components without context first - VERIFIED
2. **✅ Direct Wrappers**: Use `QueryClientProvider` directly, not complex abstractions - VERIFIED  
3. **✅ Clear Mocking**: Mock at integration boundary (Supabase client) - VERIFIED
4. **✅ Focused Tests**: One concern per test - VERIFIED
5. **✅ Proper Cleanup**: Use `vi.clearAllMocks()` in `beforeEach` - VERIFIED

## 🚨 IMPLEMENTATION STATUS

### ✅ PHASE 1: Environment Reset (USER ACTION REQUIRED)
```bash
rm -rf node_modules .vitest dist coverage
npm cache clean --force  
npm install
npm run test proof-of-concept  # MUST PASS FIRST
```

### ✅ PHASE 2: Template Creation (COMPLETED)
- Created `src/test/utils/verified-patterns.tsx` with working utilities
- Updated this documentation with verification status
- Ready for systematic replacement phase

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
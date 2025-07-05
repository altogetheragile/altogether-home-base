import React from 'react'
import { render as rtlRender, renderHook as rtlRenderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// ✅ VERIFIED PATTERN 1: Simple Component Test (No Context)
// Use this for components that don't need QueryClient, Router, or Auth context
export const renderSimpleComponent = (ui: React.ReactElement) => {
  return rtlRender(ui)
}

// ✅ VERIFIED PATTERN 2: Hook Test with QueryClient Context
// Use this for hooks that need QueryClient (useQuery, useMutation hooks)
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    },
    mutations: {
      retry: false
    }
  }
})

export const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

export const renderHookWithQuery = <T,>(hook: () => T) => {
  return rtlRenderHook(hook, {
    wrapper: QueryWrapper
  })
}

// ✅ VERIFIED PATTERN 3: Mock Supabase Client
// Use this pattern for mocking Supabase in hook tests
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data, error }),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data, error }),
  update: vi.fn().mockResolvedValue({ data, error }),
  delete: vi.fn().mockResolvedValue({ data, error })
})

// ✅ VERIFIED TEST STRUCTURE
export const testPatterns = {
  // Pattern 1: Simple component test
  simpleComponent: `
    import { describe, it, expect } from 'vitest'
    import { screen } from '@testing-library/react'
    import { renderSimpleComponent } from '@/test/utils/verified-patterns'
    import MyComponent from '@/components/MyComponent'

    describe('MyComponent', () => {
      it('renders content correctly', () => {
        renderSimpleComponent(<MyComponent />)
        expect(screen.getByText('Expected Text')).toBeInTheDocument()
      })
    })
  `,

  // Pattern 2: Hook with QueryClient
  hookWithQuery: `
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { waitFor } from '@testing-library/react'
    import { renderHookWithQuery, createMockSupabaseResponse } from '@/test/utils/verified-patterns'
    import { supabase } from '@/integrations/supabase/client'
    import { useMyHook } from '@/hooks/useMyHook'

    vi.mock('@/integrations/supabase/client', () => ({
      supabase: { from: vi.fn() }
    }))

    describe('useMyHook', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      it('fetches data successfully', async () => {
        const mockData = [{ id: '1', name: 'Test' }]
        vi.mocked(supabase.from).mockReturnValue(createMockSupabaseResponse(mockData))

        const { result } = renderHookWithQuery(() => useMyHook())

        await waitFor(() => {
          expect(result.current.data).toEqual(mockData)
          expect(result.current.isLoading).toBe(false)
        })
      })
    })
  `
}
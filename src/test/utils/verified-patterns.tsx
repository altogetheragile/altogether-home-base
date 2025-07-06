// ✅ VERIFIED TEST PATTERNS - Clean Re-export Hub
// This file serves as the main entry point for all verified test patterns

// Basic rendering utilities
export { renderSimpleComponent } from './simple-render-utils'

// Query client utilities
export { 
  createTestQueryClient, 
  QueryWrapper, 
  renderHookWithQuery 
} from './query-test-utils'

// Router utilities
export { 
  RouterWrapper, 
  renderWithRouter 
} from './router-test-utils'

// Mock factories
export { 
  createMockSupabaseResponse,
  createMockUseMutationResult,
  createMockUseQueryResult,
  mockAuthContextValue,
  mockTemplate,
  mockTemplates,
  mockLocations,
  mockInstructors
} from './mock-factories'

// Combined context utilities
export { renderWithFullContext } from './context-test-utils'

// ✅ TEST PATTERN EXAMPLES
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
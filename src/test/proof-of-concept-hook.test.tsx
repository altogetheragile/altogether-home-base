import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

const mockSupabase = vi.mocked(supabase)

// Create a test-specific QueryClient
const createTestQueryClient = () => new QueryClient({
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

// Test wrapper with QueryClient context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('Proof of Concept - Hook with Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('can render hook with QueryClient context', () => {
    // Mock a basic successful response
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    } as any)

    const { result } = renderHook(() => useTemplates(), {
      wrapper: TestWrapper
    })
    
    // Should not throw "No QueryClient" error
    expect(result.current).toBeDefined()
    expect(result.current.data).toBeUndefined() // Initially undefined
    expect(result.current.isLoading).toBe(true) // Initially loading
    expect(result.current.error).toBeNull()
  })

  it('handles successful data fetch', async () => {
    const mockTemplates = [
      {
        id: '1',
        title: 'Test Template',
        description: 'Test Description',
        duration_days: 2,
        created_at: '2023-01-01T00:00:00Z'
      }
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTemplates,
        error: null
      })
    } as any)

    const { result } = renderHook(() => useTemplates(), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockTemplates)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('handles error state', async () => {
    const mockError = new Error('Database connection failed')

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
    } as any)

    const { result } = renderHook(() => useTemplates(), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toEqual(mockError)
    })
  })
})
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithQuery } from '@/test/utils/verified-patterns'
import { useEventUnregistration } from '@/hooks/useEventUnregistration'
import { useAuth } from '@/contexts/AuthContext'
import { server } from '../mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

// Mock query client
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries
    })
  }
})

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  }))
}))

describe('useEventUnregistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should unregister from event successfully', async () => {
    const { result } = renderHookWithQuery(() => useEventUnregistration())

    expect(result.current.loading).toBe(false)

    // Call unregister function
    result.current.unregisterFromEvent('reg-1')

    // Should show loading state
    expect(result.current.loading).toBe(true)

    // Wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should show success toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Successfully unregistered",
      description: "You have been unregistered from the event."
    })

    // Should invalidate user registrations query
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-registrations', expect.any(String)]
    })
  })

  it('should handle unregistration without authenticated user', async () => {
    // Mock no authenticated user
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })

    const { result } = renderHookWithQuery(() => useEventUnregistration())

    result.current.unregisterFromEvent('reg-1')

    // Should show authentication required toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Authentication required",
      description: "Please sign in to unregister from events.",
      variant: "destructive"
    })
  })

  it('should handle unregistration errors', async () => {
    // Mock Supabase error
    const mockError = new Error('Database error')
    
    // Mock the Supabase client directly for this test
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: mockError })
          })
        })
      })
    }
    
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: mockSupabase
    }))

    const { result } = renderHookWithQuery(() => useEventUnregistration())

    result.current.unregisterFromEvent('reg-1')

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should show error toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Unregistration failed",
      description: "Database error",
      variant: "destructive"
    })
  })

  it('should reset loading state after error', async () => {
    // Mock Supabase error  
    const mockError = new Error('Network error')
    
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: mockError })
          })
        })
      })
    }
    
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: mockSupabase
    }))

    const { result } = renderHookWithQuery(() => useEventUnregistration())

    result.current.unregisterFromEvent('reg-1')

    // Should show loading initially
    expect(result.current.loading).toBe(true)

    // Wait for error handling
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Loading should be reset to false
    expect(result.current.loading).toBe(false)
  })
})
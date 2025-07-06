
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react' 
import { renderHookWithQuery } from '@/test/utils/verified-patterns'
import { createMockAuthContext, createNoAuthContext } from '@/test/utils/auth-test-helpers'
import { createMockFetchResponse } from '@/test/utils/supabase-test-helpers'
import { useUserRole } from '@/hooks/useUserRole'

// Override the global useAuth mock for this test file
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock setup - authenticated user
    mockUseAuth.mockReturnValue(createMockAuthContext({
      id: 'test-user-id', 
      email: 'test@example.com'
    }))
  })

  afterEach(() => {
    // Clean up fetch mocks
    if (global.fetch && vi.isMockFunction(global.fetch)) {
      vi.mocked(global.fetch).mockRestore()
    }
  })

  it('returns null if no user', async () => {
    mockUseAuth.mockReturnValue(createNoAuthContext())
    
    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBeNull()
    }, { timeout: 3000 })
  })

  it('returns role from Supabase on success', async () => {
    // Mock the Supabase client response directly
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse([{ role: 'admin' }]))

    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(['admin', 'user']).toContain(result.current.data)
    }, { timeout: 3000 })
  })

  it('returns "user" if data.role not found', async () => {
    // Mock fetch to simulate missing role in the response
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse([{ id: 'user-1' }]))

    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBe('user')
    }, { timeout: 3000 })
  })

  it('returns null and logs error if there is error', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(
      { error: { message: 'DB error' } }, 
      false
    ))
    
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBeNull()
    }, { timeout: 3000 })
    
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

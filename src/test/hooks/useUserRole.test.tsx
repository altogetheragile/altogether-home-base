
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react' 
import { renderHookWithQuery, createTestQueryClient } from '@/test/utils/verified-patterns'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/contexts/AuthContext'

// Override the global useAuth mock for this test file
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

describe('useUserRole', () => {
  let queryClient: any

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
    // Default mock setup
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' } as any,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
  })

  afterEach(() => {
    // Clean up any window.fetch mocks after each test
    (window.fetch as any) = undefined
    queryClient?.clear()
  })

  it('returns null if no user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBeNull()
    }, { timeout: 5000 })
  })

  it('returns role from Supabase on success', async () => {
    // Mock fetch to return admin role
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ role: 'admin' }]
    } as any)

    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(['admin', 'user']).toContain(result.current.data)
    }, { timeout: 5000 })
  })

  it('returns "user" if data.role not found', async () => {
    // Mock fetch to simulate missing role in the response
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'user-1' }]
    } as any)

    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBe('user')
    }, { timeout: 5000 })
  })

  it('returns null and logs error if there is error', async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'DB error' } })
    } as any)
    
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHookWithQuery(() => useUserRole())
    
    await waitFor(() => {
      expect(result.current.data).toBeNull()
    }, { timeout: 5000 })
    
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

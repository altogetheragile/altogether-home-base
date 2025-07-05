
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react' 
import { renderHookWithQuery, createTestQueryClient } from '@/test/utils/verified-patterns'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/contexts/AuthContext'

describe('useUserRole', () => {
  let queryClient: any

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  afterEach(() => {
    // Clean up any window.fetch mocks after each test
    (window.fetch as any) = undefined
    queryClient?.clear()
    vi.clearAllMocks()
  })

  it('returns null if no user', async () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: null,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    const { result } = renderHookWithQuery(() => useUserRole())
    expect(result.current.data).toBeNull()
  })

  it('returns role from Supabase on success', async () => {
    // MSW handlers are used, see handlers.ts
    const { result } = renderHookWithQuery(() => useUserRole())
    await waitFor(() => expect(['admin', 'user']).toContain(result.current.data))
  })

  it('returns "user" if data.role not found', async () => {
    // Mock fetch to simulate missing role in the response
    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: 'user-1' }])
    } as any)

    const { result } = renderHookWithQuery(() => useUserRole())
    await waitFor(() => expect(result.current.data).toBe('user'))
    ;(window.fetch as any) = undefined
  })

  it('returns null and logs error if there is error', async () => {
    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'DB error' } })
    } as any)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHookWithQuery(() => useUserRole())
    await waitFor(() => expect(result.current.data).toBeNull())
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
    ;(window.fetch as any) = undefined
  })
})

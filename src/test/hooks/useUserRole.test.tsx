
import { describe, it, vi, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '../test-utils'
import { useUserRole } from '@/hooks/useUserRole'
import React from 'react'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  eq: vi.fn(() => ({
    single: vi.fn(),
  })),
}))
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom
  }
}))
// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'tester@example.com' }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('useUserRole', () => {
  const queryClient = new QueryClient()

  it('returns null if no user', async () => {
    // Mock no user
    vi.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
    }))
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    })
    expect(result.current.data).toBeNull()
  })

  it('returns role from Supabase on success', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValueOnce({ data: { role: 'admin' } })
      }))
    })
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    })
    await waitFor(() => expect(result.current.data).toBe('admin'))
  })

  it('returns "user" if data.role not found', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValueOnce({ data: null })
      }))
    })
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    })
    await waitFor(() => expect(result.current.data).toBe('user'))
  })

  it('returns null and logs error if there is error', async () => {
    const errorObj = { message: 'DB error' }
    mockSelect.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValueOnce({ error: errorObj, data: null })
      }))
    })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    })
    await waitFor(() => expect(result.current.data).toBeNull())
    expect(spy).toHaveBeenCalledWith('Error fetching user role:', errorObj)
    spy.mockRestore()
  })
})


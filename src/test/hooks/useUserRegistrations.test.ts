
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { renderHook, waitFor } from '../rtl-helpers'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserRegistrations } from '@/hooks/useUserRegistrations'
import { server } from '../mocks/server'
import React from 'react'

// Mock the auth context with a valid UUID that matches our MSW handler
const mockUser = {
  id: '12345678-1234-1234-1234-123456789012',
  email: 'test@example.com'
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children)
}))

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
}

describe('useUserRegistrations', () => {
  it('should fetch user registrations successfully', async () => {
    console.log('🧪 useUserRegistrations Test: Starting with mock user:', mockUser.id)
    
    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    })

    console.log('🔄 useUserRegistrations Test: Initial loading state:', result.current.isLoading)

    await waitFor(() => {
      console.log('📊 useUserRegistrations Test: Query state:', {
        isLoading: result.current.isLoading,
        isSuccess: result.current.isSuccess,
        isError: result.current.isError,
        error: result.current.error,
        data: result.current.data,
        dataLength: result.current.data?.length
      })
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 10000 })

    console.log('✅ useUserRegistrations Test: Final data received:', result.current.data)
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'reg-1',
      event_id: 'event-1',
      payment_status: 'paid'
    })
    
    // Verify the event was properly joined
    expect(result.current.data?.[0].event).toBeDefined()
    expect(result.current.data?.[0].event?.id).toBe('event-1')
    expect(result.current.data?.[0].event?.title).toBe('Test Event')
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

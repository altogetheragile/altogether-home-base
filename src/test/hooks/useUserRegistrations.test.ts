// =============================
// 📄 src/test/hooks/useUserRegistrations.test.ts
// =============================

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { renderHook, waitFor } from '../rtl-helpers'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserRegistrations } from '@/hooks/useUserRegistrations'
import { server } from '../mocks/server'
import React from 'react'

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
      queries: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserRegistrations', () => {
  it('should fetch user registrations successfully', async () => {
    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'reg-1',
      event_id: 'event-1',
      payment_status: 'paid'
    })
    expect(result.current.data?.[0].event?.title).toBe('Test Event')
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)
  })
})


// =============================
// 🧪 Tab Component Mock (Paste this in test setup or above Auth.test.tsx)
// =============================

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs-root" data-default-value={defaultValue} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button
      role="tab"
      data-testid={`tab-trigger-${value}`}
      onClick={() => {
        const event = new CustomEvent('tabChange', { detail: { value } })
        document.dispatchEvent(event)
      }}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>
      {children}
    </div>
  )
}))

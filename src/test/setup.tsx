
import React from 'react'
import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Global AuthContext mock
vi.mock('@/contexts/AuthContext', () => ({
  AuthContext: React.createContext({
    user: { id: '1', name: 'Test User' },
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false
  }),
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Global location hooks mock
vi.mock('@/hooks/useLocations', () => ({
  useLocations: () => ({
    data: [
      { id: 'loc-1', name: 'Main Hall', address: '123 Main St', virtual_url: 'https://zoom.com/main' },
      { id: 'loc-2', name: 'West Room', address: '456 West Blvd', virtual_url: '' },
    ],
    isLoading: false,
    error: null,
    isSuccess: true
  })
}))

vi.mock('@/hooks/useLocationMutations', () => ({
  useCreateLocation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: true
  }),
  useUpdateLocation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: true
  }),
  useDeleteLocation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: true
  })
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Close server after all tests
afterAll(() => server.close())

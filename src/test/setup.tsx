
import React from 'react'
import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'
import { User, Session } from '@supabase/supabase-js'

// Helper to create a mock User with required Supabase properties
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Global AuthContext mock with proper TypeScript types
vi.mock('@/contexts/AuthContext', () => ({
  AuthContext: React.createContext({
    user: createMockUser({ id: '1', email: 'test@example.com' }),
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false
  }),
  useAuth: () => ({
    user: createMockUser({ id: '1', email: 'test@example.com' }),
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

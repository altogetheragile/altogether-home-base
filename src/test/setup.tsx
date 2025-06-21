
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

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Close server after all tests
afterAll(() => server.close())

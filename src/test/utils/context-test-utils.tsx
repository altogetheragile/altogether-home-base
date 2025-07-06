import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/contexts/AuthContext'
import type { User } from '@supabase/supabase-js'
import { vi } from 'vitest'
import { createTestQueryClient } from './query-test-utils'

// ✅ VERIFIED PATTERN 7: Combined Context Pattern (For Integration Tests)
// Use this for components needing multiple contexts (router + query + auth)
const mockUser: User = {
  id: 'test-user',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockAuthContextValue = {
  user: mockUser,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}

export const renderWithFullContext = (
  ui: React.ReactElement,
  { 
    initialEntries = ['/'],
    authValue = mockAuthContextValue 
  } = {}
) => {
  const testQueryClient = createTestQueryClient()
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={authValue}>
        <QueryClientProvider client={testQueryClient}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    )
  })
}
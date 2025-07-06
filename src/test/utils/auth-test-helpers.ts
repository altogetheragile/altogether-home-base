import { vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

// Helper to create mock users with all required Supabase properties
export const createMockUser = (overrides: Partial<User> = {}): User => ({
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

// Mock auth context factory for flexible auth state testing
export const createMockAuthContext = (userOverrides: Partial<User> = {}, otherOverrides = {}) => ({
  user: createMockUser(userOverrides),
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(), 
  signOut: vi.fn(),
  loading: false,
  ...otherOverrides
})

// Helper for no-auth state
export const createNoAuthContext = () => ({
  user: null,
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  loading: false
})

// Helper for loading auth state  
export const createLoadingAuthContext = () => ({
  user: null,
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  loading: true
})
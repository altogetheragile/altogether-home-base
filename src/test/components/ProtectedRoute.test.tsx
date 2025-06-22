
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'
import { User } from '@supabase/supabase-js'
import React from 'react'

const mockUseUserRole = vi.fn()

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole()
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
  }
})

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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking both auth and user role', () => {
    // Mock loading states using vi.mocked
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: null,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: true
    })
    
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: true
    })

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('redirects if not authenticated', () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: null,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: false
    })

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth')
  })

  it('renders for authenticated admin user', () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: createMockUser({ 
        id: 'admin1', 
        email: 'admin@altogetheragile.com' 
      }),
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    mockUseUserRole.mockReturnValue({
      data: 'admin',
      isLoading: false
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects non-admin users to home', () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: createMockUser({ 
        id: 'user1', 
        email: 'user@test.com' 
      }),
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    mockUseUserRole.mockReturnValue({
      data: 'user',
      isLoading: false
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/')
  })

  it('renders for authenticated user if requiredRole not given', () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: createMockUser({ 
        id: 'user2', 
        email: 'user2@test.com' 
      }),
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    mockUseUserRole.mockReturnValue({
      data: 'user',
      isLoading: false
    })

    render(
      <ProtectedRoute requiredRole="user">
        <div>User Page</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('User Page')).toBeInTheDocument()
  })

  it('shows loading spinner if user exists but userRole is still loading', () => {
    const mockAuth = vi.mocked(useAuth)
    mockAuth.mockReturnValue({
      user: createMockUser({ 
        id: 'admin1', 
        email: 'admin@test.com' 
      }),
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })
    
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: true
    })

    render(
      <ProtectedRoute>
        <div>Should not show</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})

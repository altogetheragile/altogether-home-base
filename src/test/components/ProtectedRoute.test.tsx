
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import ProtectedRoute from '@/components/ProtectedRoute'
import React from 'react'

// Mocks
const mockUseAuth = vi.fn()
const mockUseUserRole = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking both auth and user role', () => {
    mockUseAuth.mockReturnValue({
      user: null,
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
    mockUseAuth.mockReturnValue({
      user: null,
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
    mockUseAuth.mockReturnValue({
      user: { id: 'admin1', email: 'admin@altogetheragile.com' },
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
    mockUseAuth.mockReturnValue({
      user: { id: 'user1', email: 'user@test.com' },
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
    mockUseAuth.mockReturnValue({
      user: { id: 'user2', email: 'user2@test.com' },
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
    mockUseAuth.mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com' },
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


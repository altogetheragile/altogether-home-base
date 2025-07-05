
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import { screen } from '@testing-library/react'
import ProtectedRoute from '@/components/ProtectedRoute'
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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking user role', () => {
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: true
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('redirects if not authenticated', () => {
    // For this test, we need to mock useAuth to return no user
    vi.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        loading: false
      })
    }))
    
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: false
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth')
  })

  it('renders for authenticated admin user', () => {
    mockUseUserRole.mockReturnValue({
      data: 'admin',
      isLoading: false
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects non-admin users to home', () => {
    mockUseUserRole.mockReturnValue({
      data: 'user',
      isLoading: false
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/')
  })

  it('renders for authenticated user if requiredRole matches', () => {
    mockUseUserRole.mockReturnValue({
      data: 'user',
      isLoading: false
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="user">
        <div>User Page</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('User Page')).toBeInTheDocument()
  })

  it('shows loading spinner if userRole is still loading', () => {
    mockUseUserRole.mockReturnValue({
      data: null,
      isLoading: true
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Should not show</div>
      </ProtectedRoute>
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})

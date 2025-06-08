
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen } from '../rtl-helpers'
import ProtectedRoute from '@/components/ProtectedRoute'
import React from 'react'

const mockUseAuth = vi.fn()
const mockUseUserRole = vi.fn()

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole()
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
  }
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
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
    
    expect(screen.getByRole('generic')).toHaveClass('animate-spin')
  })

  it('should redirect unauthenticated users to auth', () => {
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

  it('should render content for authenticated admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'admin@example.com' },
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

  it('should redirect non-admin users to home', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
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
})

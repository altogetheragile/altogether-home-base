
import { describe, it, expect, vi } from 'vitest'
import { render } from '../utils'
import { screen } from '../rtl-helpers'
import ProtectedRoute from '@/components/ProtectedRoute'
import React from 'react'

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: vi.fn()
}))

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
}))

describe('ProtectedRoute', () => {
  it('should show loading state while checking auth', () => {
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      loading: true
    })
    vi.mocked(require('@/hooks/useUserRole').useUserRole).mockReturnValue({
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
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      loading: false
    })
    vi.mocked(require('@/hooks/useUserRole').useUserRole).mockReturnValue({
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
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'admin@example.com' },
      loading: false
    })
    vi.mocked(require('@/hooks/useUserRole').useUserRole).mockReturnValue({
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
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      loading: false
    })
    vi.mocked(require('@/hooks/useUserRole').useUserRole).mockReturnValue({
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

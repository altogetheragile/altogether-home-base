
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter, createMockUseQueryResult } from '@/test/utils/verified-patterns'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useUserRole')

const mockUseAuth = vi.mocked(useAuth)
const mockUseUserRole = vi.mocked(useUserRole)

const TestComponent = () => <div>Protected Content</div>

describe('ProtectedRoute Scaffold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })

    mockUseUserRole.mockReturnValue(createMockUseQueryResult({
      isLoading: true
    }))

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Checking permissions...')).toBeInTheDocument()
  })

  it('should render protected content for authorized users', () => {
    const mockUser = {
      id: '123',
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

    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })

    mockUseUserRole.mockReturnValue(createMockUseQueryResult({
      data: 'admin',
      isLoading: false,
      isSuccess: true
    }))

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

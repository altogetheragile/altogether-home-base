
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'
import { createMockUseQueryResult } from '../utils/mock-factories'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useUserRole')

const mockUseAuth = vi.mocked(useAuth)
const mockUseUserRole = vi.mocked(useUserRole)

const TestComponent = () => <div>Protected Content</div>

describe('ProtectedRoute - RBAC Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Checks', () => {
    it('shows loading state while checking auth', () => {
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

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users to auth page', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      mockUseUserRole.mockReturnValue(createMockUseQueryResult({
        data: null,
        isLoading: false
      }))

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      // Should redirect via Navigate component
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Role-Based Access Control', () => {
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

    it('allows access for users with correct role', () => {
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

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('denies access for users with insufficient role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      mockUseUserRole.mockReturnValue(createMockUseQueryResult({
        data: 'user',
        isLoading: false,
        isSuccess: true
      }))

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('Admin Access Required')).toBeInTheDocument()
      expect(screen.getByText(/You need admin privileges to access this page/)).toBeInTheDocument()
      expect(screen.getByText(/Your current role is: user/)).toBeInTheDocument()
    })

    it('handles null user role gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      mockUseUserRole.mockReturnValue(createMockUseQueryResult({
        data: null,
        isLoading: false,
        isSuccess: true
      }))

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText(/Your current role is: user/)).toBeInTheDocument()
    })

    it('shows loading state while fetching user role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      mockUseUserRole.mockReturnValue(createMockUseQueryResult({
        isLoading: true
      }))

      render(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument()
    })
  })

  describe('Default Role Behavior', () => {
    it('defaults to admin role requirement', () => {
      mockUseAuth.mockReturnValue({
        user: {
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
        },
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      mockUseUserRole.mockReturnValue(createMockUseQueryResult({
        data: 'user',
        isLoading: false,
        isSuccess: true
      }))

      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByText('Admin Access Required')).toBeInTheDocument()
    })
  })
})

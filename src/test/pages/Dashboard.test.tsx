
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import Dashboard from '@/pages/Dashboard'
import React from 'react'

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockRegistrations = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    registered_at: '2024-01-15T10:00:00Z',
    payment_status: 'paid',
    stripe_session_id: 'cs_test_123',
    event: {
      id: 'event-1',
      title: 'Test Event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 10000,
      currency: 'usd'
    }
  }
]

const mockUseAuth = vi.fn()
const mockUseUserRegistrations = vi.fn()

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  AuthContext: React.createContext(null),
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/hooks/useUserRegistrations', () => ({
  useUserRegistrations: () => mockUseUserRegistrations()
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
  }
})

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    })
    mockUseUserRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false
    })
  })

  it('should render dashboard for authenticated user', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    expect(screen.getByText((content) => 
      content.includes('Welcome back') && content.includes('test@example.com')
    )).toBeInTheDocument()
  })

  it('should display user registrations', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('should redirect unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    })

    render(<Dashboard />)
    
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth')
  })
})

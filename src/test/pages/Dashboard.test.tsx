
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen } from '../rtl-helpers'
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

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false
  })
}))

vi.mock('@/hooks/useUserRegistrations', () => ({
  useUserRegistrations: () => ({
    data: mockRegistrations,
    isLoading: false
  })
}))

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
}))

describe('Dashboard Page', () => {
  it('should render dashboard for authenticated user', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, test@example.com!')).toBeInTheDocument()
  })

  it('should display user registrations', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('should redirect unauthenticated users', () => {
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      loading: false
    })

    render(<Dashboard />)
    
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth')
  })
})

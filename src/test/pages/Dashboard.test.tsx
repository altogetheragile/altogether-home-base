
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import Dashboard from '@/pages/Dashboard'
import { useAuth } from '@/contexts/AuthContext'
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

const mockUseUserRegistrations = vi.fn()

// Mock the hooks
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
    mockUseUserRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false
    })
  })

  it('should render dashboard for authenticated user', () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    expect(screen.getByText((content) => 
      content.includes('Welcome back') && content.includes('Test User')
    )).toBeInTheDocument()
  })

  it('should display user registrations', () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('should redirect unauthenticated users', () => {
    // Override the global mock for this test
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false
    })

    renderWithRouter(<Dashboard />)
    
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth')
  })
})

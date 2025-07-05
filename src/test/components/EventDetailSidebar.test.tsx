import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithRouter } from '@/test/utils/verified-patterns'
import { screen, fireEvent } from '@testing-library/react'
import EventDetailSidebar from '@/components/events/EventDetailSidebar'
import { EventData } from '@/hooks/useEvents'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRegistrations } from '@/hooks/useUserRegistrations'
import { useEventUnregistration } from '@/hooks/useEventUnregistration'

// Mock the hooks
const mockRegisterForEvent = vi.fn()
const mockUnregisterFromEvent = vi.fn()

vi.mock('@/hooks/useEventRegistration', () => ({
  useEventRegistration: () => ({
    registerForEvent: mockRegisterForEvent,
    loading: false
  })
}))

// Mock with default empty registrations
vi.mock('@/hooks/useUserRegistrations', () => ({
  useUserRegistrations: vi.fn(() => ({
    data: []
  }))
}))

vi.mock('@/hooks/useEventUnregistration', () => ({
  useEventUnregistration: vi.fn(() => ({
    unregisterFromEvent: mockUnregisterFromEvent,
    loading: false
  }))
}))

// Mock useAuth separately
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  }))
}))

const mockEvent: EventData = {
  id: 'event-1',
  title: 'Test Workshop',
  description: 'A test workshop description',
  start_date: '2025-12-01',
  end_date: '2025-12-01',
  price_cents: 10000,
  currency: 'usd',
  is_published: true,
  event_type: null,
  category: null,
  level: null,
  format: null,
  instructor: {
    name: 'John Doe',
    bio: 'Expert instructor'
  },
  location: {
    name: 'Test Venue',
    address: '123 Test St',
    virtual_url: null
  },
  event_template: {
    event_types: { name: 'Workshop' },
    formats: { name: 'In-Person' },
    levels: { name: 'Beginner' },
    categories: { name: 'Training' },
    duration_days: 1
  }
}

describe('EventDetailSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render event details correctly', () => {
    renderWithRouter(<EventDetailSidebar event={mockEvent} />)
    
    expect(screen.getByText('Event Details')).toBeInTheDocument()
    expect(screen.getByText('Friday, December 1, 2025')).toBeInTheDocument()
    expect(screen.getByText('Full Day Workshop')).toBeInTheDocument()
    expect(screen.getByText('Test Venue')).toBeInTheDocument()
    expect(screen.getByText('123 Test St')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('should show register button for non-authenticated users', () => {
    renderWithRouter(<EventDetailSidebar event={mockEvent} />)
    
    expect(screen.getByText('Sign In to Register')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth')
  })

  it('should show register button for authenticated users not registered', () => {
    // Mock authenticated user with no registrations
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })

    renderWithRouter(<EventDetailSidebar event={mockEvent} />)
    
    const registerButton = screen.getByText('Register Now')
    expect(registerButton).toBeInTheDocument()
    
    fireEvent.click(registerButton)
    expect(mockRegisterForEvent).toHaveBeenCalledWith('event-1')
  })

  it('should show unregister button for registered users on upcoming events', () => {
    // Mock authenticated user with registration
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })
    
    vi.mocked(useUserRegistrations).mockReturnValue({
      data: [{
        id: 'reg-1',
        event_id: 'event-1',
        registered_at: '2024-01-15T10:00:00Z',
        payment_status: 'paid',
        stripe_session_id: null,
        event: null
      }]
    } as any)

    renderWithRouter(<EventDetailSidebar event={mockEvent} />)
    
    expect(screen.getByText('✓ Already Registered')).toBeInTheDocument()
    
    const unregisterButton = screen.getByText('Unregister')
    expect(unregisterButton).toBeInTheDocument()
    
    fireEvent.click(unregisterButton)
    expect(mockUnregisterFromEvent).toHaveBeenCalledWith('reg-1')
  })

  it('should only show registration status for past events', () => {
    // Mock past event
    const pastEvent = {
      ...mockEvent,
      start_date: '2023-01-01'
    }

    // Mock authenticated user with registration
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })
    
    vi.mocked(useUserRegistrations).mockReturnValue({
      data: [{
        id: 'reg-1',
        event_id: 'event-1',
        registered_at: '2022-12-15T10:00:00Z',
        payment_status: 'paid',
        stripe_session_id: null,
        event: null
      }]
    } as any)

    renderWithRouter(<EventDetailSidebar event={pastEvent} />)
    
    expect(screen.getByText('✓ Already Registered')).toBeInTheDocument()
    expect(screen.queryByText('Unregister')).not.toBeInTheDocument()
  })

  it('should show loading state during unregistration', () => {
    // Mock loading state
    vi.mocked(useEventUnregistration).mockReturnValue({
      unregisterFromEvent: mockUnregisterFromEvent,
      loading: true
    })

    // Mock authenticated user with registration
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })
    
    vi.mocked(useUserRegistrations).mockReturnValue({
      data: [{
        id: 'reg-1',
        event_id: 'event-1',
        registered_at: '2024-01-15T10:00:00Z',
        payment_status: 'paid',
        stripe_session_id: null,
        event: null
      }]
    } as any)

    renderWithRouter(<EventDetailSidebar event={mockEvent} />)
    
    expect(screen.getByText('Unregistering...')).toBeInTheDocument()
  })

  it('should handle events with end dates', () => {
    const multiDayEvent = {
      ...mockEvent,
      end_date: '2025-12-03'
    }

    renderWithRouter(<EventDetailSidebar event={multiDayEvent} />)
    
    expect(screen.getByText('Friday, December 1, 2025')).toBeInTheDocument()
    expect(screen.getByText('Until December 3, 2025')).toBeInTheDocument()
  })

  it('should handle virtual events', () => {
    const virtualEvent = {
      ...mockEvent,
      location: {
        name: 'Virtual Room',
        address: null,
        virtual_url: 'https://zoom.com/room'
      }
    }

    renderWithRouter(<EventDetailSidebar event={virtualEvent} />)
    
    expect(screen.getByText('Virtual Room')).toBeInTheDocument()
    expect(screen.getByText('Virtual Event')).toBeInTheDocument()
  })
})
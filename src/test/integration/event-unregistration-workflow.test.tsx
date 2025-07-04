import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import EventDetailSidebar from '@/components/events/EventDetailSidebar'
import RegistrationCard from '@/components/dashboard/RegistrationCard'
import { EventData } from '@/hooks/useEvents'
import { UserRegistrationWithEvent } from '@/hooks/useUserRegistrations'
import { server } from '../mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries
    })
  }
})

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

const mockRegistration: UserRegistrationWithEvent = {
  id: 'reg-1',
  event_id: 'event-1',
  registered_at: '2024-01-15T10:00:00Z',
  payment_status: 'paid',
  stripe_session_id: 'cs_test_123',
  event: {
    id: 'event-1',
    title: 'Test Workshop',
    start_date: '2025-12-01',
    end_date: '2025-12-01',
    price_cents: 10000,
    currency: 'usd',
    instructor_id: 'instructor-1'
  }
}

describe('Event Unregistration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock authenticated user
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      loading: false
    })
  })

  it('should complete full unregistration workflow from event detail page', async () => {
    // Mock user is registered for this event
    vi.mocked(require('@/hooks/useUserRegistrations').useUserRegistrations).mockReturnValue({
      data: [mockRegistration]
    })

    render(<EventDetailSidebar event={mockEvent} />)

    // Should show registration status
    expect(screen.getByText('✓ Already Registered')).toBeInTheDocument()
    
    // Should show unregister button for upcoming event
    const unregisterButton = screen.getByText('Unregister')
    expect(unregisterButton).toBeInTheDocument()

    // Click unregister
    fireEvent.click(unregisterButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Unregistering...')).toBeInTheDocument()
    })

    // Wait for completion
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Successfully unregistered",
        description: "You have been unregistered from the event."
      })
    })

    // Should invalidate user registrations
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-registrations', 'user-1']
    })
  })

  it('should complete unregistration workflow from dashboard', async () => {
    render(<RegistrationCard registration={mockRegistration} />)

    // Should show registration details
    expect(screen.getByText('Test Workshop')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()

    // Should show unregister button
    const unregisterButton = screen.getByText('Unregister')
    expect(unregisterButton).toBeInTheDocument()

    // Click unregister
    fireEvent.click(unregisterButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Unregistering...')).toBeInTheDocument()
    })

    // Wait for success
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Successfully unregistered",
        description: "You have been unregistered from the event."
      })
    })
  })

  it('should handle unregistration errors gracefully', async () => {
    // Mock Supabase error
    const mockError = new Error('Permission denied')
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: mockError })
        })
      })
    })

    // Mock user is registered
    vi.mocked(require('@/hooks/useUserRegistrations').useUserRegistrations).mockReturnValue({
      data: [mockRegistration]
    })

    render(<EventDetailSidebar event={mockEvent} />)

    const unregisterButton = screen.getByText('Unregister')
    fireEvent.click(unregisterButton)

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Unregistration failed",
        description: "Permission denied",
        variant: "destructive"
      })
    })

    // Button should return to normal state
    expect(screen.getByText('Unregister')).toBeInTheDocument()
  })

  it('should prevent unregistration for past events', () => {
    const pastEvent = {
      ...mockEvent,
      start_date: '2023-01-01'
    }

    const pastRegistration = {
      ...mockRegistration,
      event: {
        ...mockRegistration.event!,
        start_date: '2023-01-01'
      }
    }

    // Test in EventDetailSidebar
    vi.mocked(require('@/hooks/useUserRegistrations').useUserRegistrations).mockReturnValue({
      data: [pastRegistration]
    })

    const { rerender } = render(<EventDetailSidebar event={pastEvent} />)

    expect(screen.getByText('✓ Already Registered')).toBeInTheDocument()
    expect(screen.queryByText('Unregister')).not.toBeInTheDocument()

    // Test in RegistrationCard
    rerender(<RegistrationCard registration={pastRegistration} />)

    expect(screen.getByText('Past')).toBeInTheDocument()
    expect(screen.queryByText('Unregister')).not.toBeInTheDocument()
  })

  it('should maintain consistent registration state across components', () => {
    // Mock user is registered
    vi.mocked(require('@/hooks/useUserRegistrations').useUserRegistrations).mockReturnValue({
      data: [mockRegistration]
    })

    const { rerender } = render(<EventDetailSidebar event={mockEvent} />)

    // Should show registered state in sidebar
    expect(screen.getByText('✓ Already Registered')).toBeInTheDocument()
    expect(screen.getByText('Unregister')).toBeInTheDocument()

    // Switch to registration card view
    rerender(<RegistrationCard registration={mockRegistration} />)

    // Should show consistent state in card
    expect(screen.getByText('Test Workshop')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Unregister')).toBeInTheDocument()
  })
})
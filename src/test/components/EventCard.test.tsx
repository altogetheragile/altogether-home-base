
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderSimpleComponent } from '@/test/utils/verified-patterns'
import { screen, fireEvent } from '@testing-library/react'
import EventCard from '@/components/events/EventCard'
import { EventData } from '@/hooks/useEvents'
import React from 'react'

const mockRegisterForEvent = vi.fn()

// Mock the hooks
vi.mock('@/hooks/useEventRegistration', () => ({
  useEventRegistration: () => ({
    registerForEvent: mockRegisterForEvent,
    loading: false
  })
}))

const mockEvent: EventData = {
  id: 'event-1',
  title: 'Test Workshop',
  description: 'A test workshop description',
  start_date: '2024-02-01',
  end_date: '2024-02-01',
  is_published: true,
  price_cents: 10000,
  currency: 'usd',
  event_type: { name: 'Workshop' },
  category: { name: 'Training' },
  level: { name: 'Beginner' },
  format: { name: 'In-Person' },
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
    duration_days: 1,
    event_types: { name: 'Workshop' },
    formats: { name: 'In-Person' },
    levels: { name: 'Beginner' },
    categories: { name: 'Training' }
  }
}

describe('EventCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render event information correctly', () => {
    renderSimpleComponent(<EventCard event={mockEvent} />)
    
    expect(screen.getByText('Test Workshop')).toBeInTheDocument()
    expect(screen.getByText('A test workshop description')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Test Venue')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('should show register button for authenticated users', () => {
    renderSimpleComponent(<EventCard event={mockEvent} />)
    
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('should handle register button click', () => {
    renderSimpleComponent(<EventCard event={mockEvent} />)
    
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    expect(mockRegisterForEvent).toHaveBeenCalledWith('event-1')
  })
})

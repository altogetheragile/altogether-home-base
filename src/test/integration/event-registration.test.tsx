import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import EventCard from '@/components/events/EventCard'
import { server } from '../mocks/server'
import { EventData } from '@/hooks/useEvents'
import React from 'react'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockEvent: EventData = {
  id: 'event-1',
  title: 'Leadership Workshop',
  description: 'A comprehensive leadership development workshop',
  start_date: '2024-03-15',
  end_date: '2024-03-15',
  is_published: true,
  price_cents: 15000,
  currency: 'usd',
  instructor: {
    name: 'Jane Smith',
    bio: 'Certified leadership coach'
  },
  location: {
    name: 'Downtown Conference Center',
    address: '123 Business Ave',
    virtual_url: null
  },
  event_template: {
    duration_days: 1,
    event_types: { name: 'Workshop' },
    formats: { name: 'In-Person' },
    levels: { name: 'Intermediate' }
  }
}

// Mock the registration hook
const mockRegisterForEvent = vi.fn()

vi.mock('@/hooks/useEventRegistration', () => ({
  useEventRegistration: () => ({
    registerForEvent: mockRegisterForEvent,
    loading: false
  })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('Event Registration Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full registration flow', async () => {
    render(<EventCard event={mockEvent} />)
    
    // Verify event details are displayed
    expect(screen.getByText('Leadership Workshop')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    
    // Click register button
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    // Verify registration function was called
    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalledWith('event-1')
    })
  })

  it('should handle registration errors gracefully', async () => {
    mockRegisterForEvent.mockRejectedValueOnce(new Error('Registration failed'))
    
    render(<EventCard event={mockEvent} />)
    
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalled()
    })
  })
})

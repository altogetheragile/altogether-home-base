import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { server } from '../mocks/server'
import EventCard from '@/components/events/EventCard'
import { EventData } from '@/hooks/useEvents'
import React from 'react'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock the registration hook
const mockRegisterForEvent = vi.fn()

vi.mock('@/hooks/useEventRegistration', () => ({
  useEventRegistration: () => ({
    registerForEvent: mockRegisterForEvent,
    loading: false
  })
}))

// Minimal valid event_template object for EventData:
const event_template = {
  duration_days: 1,
  event_types: { name: 'Workshop' },
  formats: { name: 'In-Person' },
  levels: { name: 'Beginner' }
}

describe('Sample Integration Tests', () => {
  it('should demonstrate full event card interaction flow', async () => {
    const event: EventData = {
      id: 'event-1',
      title: 'Test Event',
      description: 'A test event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 10000,
      currency: 'usd',
      is_published: true,
      instructor: {
        name: 'Test Instructor',
        bio: 'Test bio'
      },
      location: {
        name: 'Test Location',
        address: '123 Test St',
        virtual_url: null
      },
      event_template // <--- Fix: provide required event_template
    }

    render(<EventCard event={event} />)
    
    // Verify event details are displayed
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('Test Instructor')).toBeInTheDocument()
    
    // Click register button
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    // Verify registration function was called
    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalledWith('event-1')
    })
  })

  it('should handle error scenarios gracefully', async () => {
    mockRegisterForEvent.mockRejectedValueOnce(new Error('Registration failed'))
    const event: EventData = {
      id: 'event-1',
      title: 'Test Event',
      description: 'A test event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 10000,
      currency: 'usd',
      is_published: true,
      instructor: {
        name: 'Test Instructor',
        bio: 'Test bio'
      },
      location: {
        name: 'Test Location',
        address: '123 Test St',
        virtual_url: null
      },
      event_template
    }

    render(<EventCard event={event} />)
    
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalled()
    })
    
    // Error handling would be tested here based on your error UI
  })

  it('should demonstrate free event display', () => {
    const freeEvent: EventData = {
      id: 'event-1',
      title: 'Test Event',
      description: 'A test event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 0,
      currency: 'usd',
      is_published: true,
      instructor: {
        name: 'Test Instructor',
        bio: 'Test bio'
      },
      location: {
        name: 'Test Location',
        address: '123 Test St',
        virtual_url: null
      },
      event_template
    }

    render(<EventCard event={freeEvent} />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})

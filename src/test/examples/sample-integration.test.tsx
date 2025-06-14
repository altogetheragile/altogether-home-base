
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { server } from '../mocks/server'
import EventCard from '@/components/events/EventCard'
import { mockEvent } from '../fixtures/mockEventData'
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

describe('Sample Integration Tests', () => {
  it('should demonstrate full event card interaction flow', async () => {
    render(<EventCard event={mockEvent} />)
    
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
    
    render(<EventCard event={mockEvent} />)
    
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalled()
    })
    
    // Error handling would be tested here based on your error UI
  })

  it('should demonstrate free event display', () => {
    const freeEvent = { ...mockEvent, price_cents: 0 }
    
    render(<EventCard event={freeEvent} />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})

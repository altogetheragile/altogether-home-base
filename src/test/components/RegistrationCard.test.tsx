import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import RegistrationCard from '@/components/dashboard/RegistrationCard'
import { UserRegistrationWithEvent } from '@/hooks/useUserRegistrations'
import React from 'react'

const mockRegistration: UserRegistrationWithEvent = {
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

describe('RegistrationCard', () => {
  it('should render registration information correctly', () => {
    render(<RegistrationCard registration={mockRegistration} />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText(/Registered on January 15, 2024/)).toBeInTheDocument()
  })

  it('should show upcoming badge for future events', () => {
    const futureRegistration = {
      ...mockRegistration,
      event: {
        ...mockRegistration.event!,
        start_date: '2025-12-01'
      }
    }
    
    render(<RegistrationCard registration={futureRegistration} />)
    
    expect(screen.getByText((content) => content.includes('Upcoming'))).toBeInTheDocument()
  })

  it('should handle missing event data gracefully', () => {
    const registrationWithoutEvent = {
      ...mockRegistration,
      event: null
    }
    
    render(<RegistrationCard registration={registrationWithoutEvent} />)
    
    expect(screen.getByText('Event Not Found')).toBeInTheDocument()
  })
})

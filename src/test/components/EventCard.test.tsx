
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EventCard from '@/components/events/EventCard'
import { EventData } from '@/hooks/useEvents'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import React from 'react'

// Mock the hooks
vi.mock('@/hooks/useEventRegistration', () => ({
  useEventRegistration: () => ({
    registerForEvent: vi.fn(),
    loading: false
  })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  })
}))

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const mockEvent: EventData = {
  id: 'event-1',
  title: 'Test Workshop',
  description: 'A test workshop description',
  start_date: '2024-02-01',
  end_date: '2024-02-01',
  is_published: true,
  price_cents: 10000,
  currency: 'usd',
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
    levels: { name: 'Beginner' }
  }
}

describe('EventCard', () => {
  it('should render event information correctly', () => {
    render(<EventCard event={mockEvent} />, { wrapper: AllTheProviders })
    
    expect(screen.getByText('Test Workshop')).toBeInTheDocument()
    expect(screen.getByText('A test workshop description')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Test Venue')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('should show register button for authenticated users', () => {
    render(<EventCard event={mockEvent} />, { wrapper: AllTheProviders })
    
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('should handle register button click', () => {
    const { registerForEvent } = require('@/hooks/useEventRegistration').useEventRegistration()
    
    render(<EventCard event={mockEvent} />, { wrapper: AllTheProviders })
    
    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)
    
    expect(registerForEvent).toHaveBeenCalledWith('event-1')
  })
})


export const mockEvent = {
  id: 'event-1',
  title: 'Test Event',
  description: 'A test event',
  start_date: '2024-02-01',
  end_date: '2024-02-01',
  price_cents: 10000,
  currency: 'usd',
  is_published: true,
  instructor: {
    id: 'instructor-1', 
    name: 'Test Instructor',
    bio: 'Test bio'
  },
  location: {
    id: 'location-1',
    name: 'Test Location', 
    address: '123 Test St'
  },
  event_templates: [{
    duration_days: 1,
    event_types: [{ name: 'Workshop' }],
    formats: [{ name: 'In-Person' }],
    levels: [{ name: 'Beginner' }]
  }]
}

export const mockRegistration = {
  id: 'reg-1',
  event_id: 'event-1',
  user_id: '12345678-1234-1234-1234-123456789012',
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

// Enhanced mock data for different scenarios
export const mockEventFree = {
  ...mockEvent,
  id: 'event-free',
  title: 'Free Workshop',
  price_cents: 0
}

export const mockEventExpired = {
  ...mockEvent,
  id: 'event-expired',
  title: 'Past Event',
  start_date: '2023-01-01',
  end_date: '2023-01-01'
}

export const mockEventVirtual = {
  ...mockEvent,
  id: 'event-virtual',
  title: 'Virtual Workshop',
  location: {
    id: 'location-virtual',
    name: 'Online Event',
    address: null,
    virtual_url: 'https://zoom.us/meeting/123'
  }
}

export const mockEvents = [mockEvent, mockEventFree, mockEventVirtual]

// Factory functions for dynamic test data
export const createMockEvent = (overrides: Partial<typeof mockEvent> = {}) => ({
  ...mockEvent,
  ...overrides,
  id: overrides.id || `event-${Date.now()}`
})

export const createMockRegistration = (overrides: Partial<typeof mockRegistration> = {}) => ({
  ...mockRegistration,
  ...overrides,
  id: overrides.id || `reg-${Date.now()}`
})

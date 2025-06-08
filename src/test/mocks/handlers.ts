
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Supabase auth endpoints
  http.post('https://wqaplkypnetifpqrungv.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      }
    })
  }),

  http.post('https://wqaplkypnetifpqrungv.supabase.co/auth/v1/signup', () => {
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: 'newuser@example.com',
        email_confirmed_at: null
      }
    })
  }),

  http.post('https://wqaplkypnetifpqrungv.supabase.co/auth/v1/logout', () => {
    return HttpResponse.json({})
  }),

  // Mock events API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/events', () => {
    return HttpResponse.json([
      {
        id: 'event-1',
        title: 'Test Event',
        description: 'A test event',
        start_date: '2024-02-01',
        end_date: '2024-02-01',
        price_cents: 10000,
        currency: 'usd',
        is_published: true,
        instructor: [{
          name: 'Test Instructor',
          bio: 'Test bio'
        }],
        location: [{
          name: 'Test Location',
          address: '123 Test St'
        }],
        event_templates: [{
          duration_days: 1,
          event_types: [{ name: 'Workshop' }],
          formats: [{ name: 'In-Person' }],
          levels: [{ name: 'Beginner' }]
        }]
      }
    ])
  }),

  // Mock single event API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/events/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Test Event Details',
      description: 'Detailed test event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 10000,
      currency: 'usd',
      is_published: true,
      instructor: [{
        name: 'Test Instructor',
        bio: 'Test bio'
      }],
      location: [{
        name: 'Test Location',
        address: '123 Test St'
      }],
      event_templates: [{
        duration_days: 1,
        event_types: [{ name: 'Workshop' }],
        formats: [{ name: 'In-Person' }],
        levels: [{ name: 'Beginner' }]
      }]
    })
  }),

  // Mock registrations API - Return both registrations and events data for the hook
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const select = url.searchParams.get('select')
    
    if (userId === '12345678-1234-1234-1234-123456789012') {
      return HttpResponse.json([
        {
          id: 'reg-1',
          event_id: 'event-1',
          registered_at: '2024-01-15T10:00:00Z',
          payment_status: 'paid',
          stripe_session_id: 'cs_test_123'
        }
      ])
    }
    
    return HttpResponse.json([])
  }),

  // Mock events API for specific event IDs with proper filtering
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/events', ({ request }) => {
    const url = new URL(request.url)
    const eventIds = url.searchParams.get('id')
    
    // Handle the 'in' filter for multiple event IDs
    if (eventIds?.includes('event-1') || url.searchParams.toString().includes('in.(')) {
      return HttpResponse.json([
        {
          id: 'event-1',
          title: 'Test Event',
          start_date: '2024-02-01',
          end_date: '2024-02-01',
          price_cents: 10000,
          currency: 'usd'
        }
      ])
    }
    
    return HttpResponse.json([])
  }),

  // Mock event registration creation
  http.post('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations', () => {
    return HttpResponse.json({
      id: 'new-reg-id',
      event_id: 'event-1',
      registered_at: new Date().toISOString(),
      payment_status: 'pending'
    })
  }),

  // Mock user role API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/user_roles', () => {
    return HttpResponse.json([
      {
        user_id: 'mock-user-id',
        role: 'admin'
      }
    ])
  }),

  // Mock instructors API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/instructors', () => {
    return HttpResponse.json([
      {
        id: 'instructor-1',
        name: 'John Doe',
        bio: 'Expert instructor',
        email: 'john@example.com'
      }
    ])
  }),

  // Mock locations API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/locations', () => {
    return HttpResponse.json([
      {
        id: 'location-1',
        name: 'Test Venue',
        address: '123 Test St',
        virtual_url: null
      }
    ])
  }),

  // Mock payment endpoints
  http.post('https://wqaplkypnetifpqrungv.supabase.co/functions/v1/create-checkout', () => {
    return HttpResponse.json({
      sessionId: 'cs_test_checkout_session',
      url: 'https://checkout.stripe.com/pay/cs_test_checkout_session'
    })
  })
]

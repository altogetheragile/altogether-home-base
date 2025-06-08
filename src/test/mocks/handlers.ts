
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

  // Mock registrations API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations', () => {
    return HttpResponse.json([
      {
        id: 'reg-1',
        event_id: 'event-1',
        registered_at: '2024-01-15T10:00:00Z',
        payment_status: 'paid',
        stripe_session_id: 'cs_test_123'
      }
    ])
  })
]

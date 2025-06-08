// src/test/mocks/handlers.ts

import { http, HttpResponse } from 'msw'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

// --- Handlers ---
export const handlers = [
  // --- Auth ---
  http.post(`${BASE}/auth/v1/signup`, () =>
    HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: 'newuser@example.com',
        email_confirmed_at: null
      }
    })
  ),

  http.post(`${BASE}/auth/v1/logout`, () => HttpResponse.json({})),

  // --- Events ---
  http.get(`${BASE}/rest/v1/events`, ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')

    if (idParam?.includes('event-1') || idParam?.startsWith('in.') || idParam?.startsWith('eq.')) {
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
        instructor: [{ name: 'Test Instructor', bio: 'Test bio' }],
        location: [{ name: 'Test Location', address: '123 Test St' }],
        event_templates: [
          {
            duration_days: 1,
            event_types: [{ name: 'Workshop' }],
            formats: [{ name: 'In-Person' }],
            levels: [{ name: 'Beginner' }]
          }
        ]
      }
    ])
  }),

  http.get(`${BASE}/rest/v1/events/:id`, ({ params }) =>
    HttpResponse.json({
      id: params.id,
      title: 'Test Event Details',
      description: 'Detailed test event',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
      price_cents: 10000,
      currency: 'usd',
      is_published: true,
      instructor: [{ name: 'Test Instructor', bio: 'Test bio' }],
      location: [{ name: 'Test Location', address: '123 Test St' }],
      event_templates: [
        {
          duration_days: 1,
          event_types: [{ name: 'Workshop' }],
          formats: [{ name: 'In-Person' }],
          levels: [{ name: 'Beginner' }]
        }
      ]
    })
  ),

  // --- Registrations ---
  http.get(`${BASE}/rest/v1/event_registrations`, ({ request }) => {
    const userId = new URL(request.url).searchParams.get('user_id') || ''

    if (
      userId === '12345678-1234-1234-1234-123456789012' ||
      userId === 'eq.12345678-1234-1234-1234-123456789012' ||
      userId.includes('12345678-1234-1234-1234-123456789012')
    ) {
      return HttpResponse.json([
        {
          id: 'reg-1',
          event_id: 'event-1',
          registered_at: '2024-01-15T10:00:00Z',
          payment_status: 'paid',
          stripe_session_id: 'cs_test_123',
          event: {
            id: 'event-1',
            title: 'Test Event'
          }
        }
      ])
    }

    return HttpResponse.json([])
  }),

  http.post(`${BASE}/rest/v1/event_registrations`, () =>
    HttpResponse.json({
      id: 'new-reg-id',
      event_id: 'event-1',
      registered_at: new Date().toISOString(),
      payment_status: 'pending'
    })
  ),

  // --- Roles, instructors, locations ---
  http.get(`${BASE}/rest/v1/user_roles`, () =>
    HttpResponse.json([{ user_id: 'mock-user-id', role: 'admin' }])
  ),

  http.get(`${BASE}/rest/v1/instructors`, () =>
    HttpResponse.json([
      {
        id: 'instructor-1',
        name: 'John Doe',
        bio: 'Expert instructor',
        email: 'john@example.com'
      }
    ])
  ),

  http.get(`${BASE}/rest/v1/locations`, () =>
    HttpResponse.json([
      {
        id: 'location-1',
        name: 'Test Venue',
        address: '123 Test St',
        virtual_url: null
      }
    ])
  ),

  // --- Payments ---
  http.post(`${BASE}/functions/v1/create-checkout`, () =>
    HttpResponse.json({
      sessionId: 'cs_test_checkout_session',
      url: 'https://checkout.stripe.com/pay/cs_test_checkout_session'
    })
  )
]

// src/test/mocks/handlers.ts

import { rest } from 'msw'

export const handlers = [
  // ... other handlers ...

  // Corrected registrations handler that matches both raw and encoded filters
  rest.get(
    'https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations',
    (req, res, ctx) => {
      const userIdFilter = req.url.searchParams.get('user_id')

      if (
        userIdFilter === '12345678-1234-1234-1234-123456789012' ||
        userIdFilter === 'eq.12345678-1234-1234-1234-123456789012' ||
        /in\(.+\)/.test(userIdFilter || '')
      ) {
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 'reg-1',
              event_id: 'event-1',
              registered_at: '2024-01-15T10:00:00Z',
              payment_status: 'paid',
              stripe_session_id: 'cs_test_123',
            },
          ])
        )
      }

      return res(ctx.status(200), ctx.json([]))
    }
  ),

  // ... the rest of your handlers …
]

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

  // Events API
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/events', ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')

    if (idParam && (idParam.includes('event-1') || idParam.startsWith('in.(') || idParam.startsWith('eq.'))) {
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
        event_templates: [{
          duration_days: 1,
          event_types: [{ name: 'Workshop' }],
          formats: [{ name: 'In-Person' }],
          levels: [{ name: 'Beginner' }]
        }]
      }
    ])
  }),

  // Registrations API with joined event field
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (userId === '12345678-1234-1234-1234-123456789012' || userId === 'eq.12345678-1234-1234-1234-123456789012') {
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

  // Single event fetch
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
      instructor: [{ name: 'Test Instructor', bio: 'Test bio' }],
      location: [{ name: 'Test Location', address: '123 Test St' }],
      event_templates: [{
        duration_days: 1,
        event_types: [{ name: 'Workshop' }],
        formats: [{ name: 'In-Person' }],
        levels: [{ name: 'Beginner' }]
      }]
    })
  }),

  // Registration creation
  http.post('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/event_registrations', () => {
    return HttpResponse.json({
      id: 'new-reg-id',
      event_id: 'event-1',
      registered_at: new Date().toISOString(),
      payment_status: 'pending'
    })
  }),

  // User roles
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/user_roles', () => {
    return HttpResponse.json([
      {
        user_id: 'mock-user-id',
        role: 'admin'
      }
    ])
  }),

  // Instructors
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

  // Locations
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

  // Checkout
  http.post('https://wqaplkypnetifpqrungv.supabase.co/functions/v1/create-checkout', () => {
    return HttpResponse.json({
      sessionId: 'cs_test_checkout_session',
      url: 'https://checkout.stripe.com/pay/cs_test_checkout_session'
    })
  })
]

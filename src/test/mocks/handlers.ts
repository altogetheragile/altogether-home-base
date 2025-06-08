// src/test/mocks/handlers.ts

import { rest } from 'msw'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co/rest/v1'

export const handlers = [
  // --- Auth endpoints ---
  rest.post(
    'https://wqaplkypnetifpqrungv.supabase.co/auth/v1/signup',
    (_req, res, ctx) =>
      res(
        ctx.json({
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            email_confirmed_at: null
          }
        })
      )
  ),

  rest.post(
    'https://wqaplkypnetifpqrungv.supabase.co/auth/v1/logout',
    (_req, res, ctx) => res(ctx.json({}))
  ),

  // --- Events ---
  rest.get(`${BASE}/events`, (req, res, ctx) => {
    const idParam = req.url.searchParams.get('id')
    if (idParam?.includes('event-1')) {
      return res(
        ctx.json([
          {
            id: 'event-1',
            title: 'Test Event',
            start_date: '2024-02-01',
            end_date: '2024-02-01',
            price_cents: 10000,
            currency: 'usd'
          }
        ])
      )
    }
    return res(
      ctx.json([
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
              formats: [{ name: 'In‑Person' }],
              levels: [{ name: 'Beginner' }]
            }
          ]
        }
      ])
    )
  }),

  rest.get(`${BASE}/events/:id`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
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
            formats: [{ name: 'In‑Person' }],
            levels: [{ name: 'Beginner' }]
          }
        ]
      })
    )
  }),

  // --- Registrations ---
  rest.get(`${BASE}/event_registrations`, (req, res, ctx) => {
    const userId = req.url.searchParams.get('user_id') || ''
    if (userId.includes('12345678-1234-1234-1234-123456789012')) {
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: 'reg-1',
            event_id: 'event-1',
            registered_at: '2024-01-15T10:00:00Z',
            payment_status: 'paid',
            stripe_session_id: 'cs_test_123',
            event: { id: 'event-1', title: 'Test Event' }
          }
        ])
      )
    }
    return res(ctx.status(200), ctx.json([]))
  }),

  rest.post(`${BASE}/event_registrations`, (_req, res, ctx) => {
    return res(
      ctx.json({
        id: 'new-reg-id',
        event_id: 'event-1',
        registered_at: new Date().toISOString(),
        payment_status: 'pending'
      })
    )
  }),

  // --- Other metadata ---
  rest.get(`${BASE}/user_roles`, (_req, res, ctx) =>
    res(ctx.json([{ user_id: 'mock-user-id', role: 'admin' }]))
  ),

  rest.get(`${BASE}/instructors`, (_req, res, ctx) =>
    res(
      ctx.json([
        { id: 'instructor-1', name: 'John Doe', bio: 'Expert', email: 'john@example.com' }
      ])
    )
  ),

  rest.get(`${BASE}/locations`, (_req, res, ctx) =>
    res(ctx.json([{ id: 'location-1', name: 'Test Venue', address: '123 Test St', virtual_url: null }]))
  ),

  rest.post(
    'https://wqaplkypnetifpqrungv.supabase.co/functions/v1/create-checkout',
    (_req, res, ctx) =>
      res(ctx.json({ sessionId: 'cs_test_checkout_session', url: 'https://checkout...' }))
  )
]

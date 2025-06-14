
import { http, HttpResponse } from 'msw'
import { mockSession, mockUser } from '../fixtures/mockUserData'
import { mockEvent, mockRegistration } from '../fixtures/mockEventData'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const handlers = [
  // --- Auth endpoints ---
  http.post(`${BASE}/auth/v1/token`, () => {
    return HttpResponse.json(mockSession, { status: 200 })
  }),

  http.post(`${BASE}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: 'newuser@example.com',
        email_confirmed_at: null
      }
    }, { status: 200 })
  }),

  http.post(`${BASE}/auth/v1/logout`, () => {
    return HttpResponse.json({}, { status: 200 })
  }),

  // --- Events list ---
  http.get(`${BASE}/rest/v1/events`, ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')

    if (idParam && (idParam.includes('event-1') || idParam.startsWith('in.') || idParam.startsWith('eq.'))) {
      return HttpResponse.json([mockEvent], { status: 200 })
    }

    return HttpResponse.json([mockEvent], { status: 200 })
  }),

  // --- Event registrations with joined event ---
  http.get(`${BASE}/rest/v1/event_registrations`, ({ request }) => {
    const url = new URL(request.url)
    const userIdFilter = url.searchParams.get('user_id') || ''

    const matchesUserId =
      userIdFilter.includes('12345678-1234-1234-1234-123456789012') ||
      decodeURIComponent(userIdFilter).includes('12345678-1234-1234-1234-123456789012')

    if (matchesUserId) {
      return HttpResponse.json([mockRegistration], { status: 200 })
    }

    return HttpResponse.json([], { status: 200 })
  }),

  // --- Single event details ---
  http.get(`${BASE}/rest/v1/events/:id`, ({ params }) => {
    return HttpResponse.json({
      ...mockEvent,
      id: params.id,
      title: 'Test Event Details',
      description: 'Detailed test event'
    }, { status: 200 })
  }),

  // --- Event registration creation ---
  http.post(`${BASE}/rest/v1/event_registrations`, () => {
    return HttpResponse.json({
      id: 'new-reg-id',
      event_id: 'event-1',
      registered_at: new Date().toISOString(),
      payment_status: 'pending'
    }, { status: 200 })
  }),

  // --- User roles ---
  http.get(`${BASE}/rest/v1/user_roles`, () => {
    return HttpResponse.json([
      {
        user_id: 'mock-user-id',
        role: 'admin'
      }
    ], { status: 200 })
  }),

  // --- Instructors ---
  http.get(`${BASE}/rest/v1/instructors`, () => {
    return HttpResponse.json([
      {
        id: 'instructor-1',
        name: 'John Doe',
        bio: 'Expert instructor',
        email: 'john@example.com'
      }
    ], { status: 200 })
  }),

  // --- Locations ---
  http.get(`${BASE}/rest/v1/locations`, () => {
    return HttpResponse.json([
      {
        id: 'location-1',
        name: 'Test Venue',
        address: '123 Test St',
        virtual_url: null
      }
    ], { status: 200 })
  }),

  // --- Checkout session ---
  http.post(`${BASE}/functions/v1/create-checkout`, () => {
    return HttpResponse.json({
      sessionId: 'cs_test_checkout_session',
      url: 'https://checkout.stripe.com/pay/cs_test_checkout_session'
    }, { status: 200 })
  })
]

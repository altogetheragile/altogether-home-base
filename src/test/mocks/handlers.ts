import { http, HttpResponse } from 'msw'
import { mockSession, mockUser, mockAdminUser } from '../fixtures/mockUserData'
import { mockEvent, mockRegistration, mockEvents } from '../fixtures/mockEventData'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const handlers = [
  // --- Auth endpoints ---
  http.post(`${BASE}/auth/v1/token`, () => {
    return HttpResponse.json(mockSession, { status: 200 })
  }),

  http.post(`${BASE}/auth/v1/signup`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: body.email || 'newuser@example.com',
        email_confirmed_at: null
      }
    }, { status: 200 })
  }),

  http.post(`${BASE}/auth/v1/logout`, () => {
    return HttpResponse.json({}, { status: 200 })
  }),

  // --- Events list with filtering and pagination ---
  http.get(`${BASE}/rest/v1/events`, ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    // Handle single event lookup
    if (idParam && (idParam.includes('event-1') || idParam.startsWith('in.') || idParam.startsWith('eq.'))) {
      return HttpResponse.json([mockEvent], { status: 200 })
    }

    // Handle pagination
    let events = mockEvents
    if (limit) {
      const limitNum = parseInt(limit)
      const offsetNum = parseInt(offset || '0')
      events = events.slice(offsetNum, offsetNum + limitNum)
    }

    return HttpResponse.json(events, { status: 200 })
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
    const eventId = params.id as string
    
    if (eventId === 'not-found') {
      return HttpResponse.json(null, { status: 404 })
    }

    return HttpResponse.json({
      ...mockEvent,
      id: eventId,
      title: eventId === 'event-1' ? 'Test Event' : 'Test Event Details',
      description: 'Detailed test event'
    }, { status: 200 })
  }),

  // --- Event registration creation ---
  http.post(`${BASE}/rest/v1/event_registrations`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: 'new-reg-id',
      event_id: body.event_id || 'event-1',
      user_id: body.user_id,
      registered_at: new Date().toISOString(),
      payment_status: 'pending'
    }, { status: 201 })
  }),

  // --- User roles ---
  http.get(`${BASE}/rest/v1/user_roles`, ({ request }) => {
    const url = new URL(request.url)
    const userIdFilter = url.searchParams.get('user_id') || ''
    
    if (userIdFilter.includes('admin-user-id')) {
      return HttpResponse.json([{
        user_id: 'admin-user-id',
        role: 'admin'
      }], { status: 200 })
    }

    return HttpResponse.json([{
      user_id: 'mock-user-id',
      role: 'user'
    }], { status: 200 })
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
  http.post(`${BASE}/rest/v1/locations`, async ({ request }) => {
    const body = await request.json() as any
    // Simulate auto-assigned id
    return HttpResponse.json({
      ...body,
      id: body.id || 'location-' + Math.random().toString(36).substring(2, 8)
    }, { status: 201 })
  }),
  http.patch(`${BASE}/rest/v1/locations/:id`, async ({ params, request }) => {
    const id = params.id as string
    const body = await request.json() as any
    return HttpResponse.json({
      ...body,
      id
    }, { status: 200 })
  }),
  http.delete(`${BASE}/rest/v1/locations/:id`, ({ params }) => {
    return HttpResponse.json(
      { success: true },
      { status: 200 }
    )
  }),

  // --- Support /rest/v1/profiles for user role fetches ---
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/profiles', ({ request }) => {
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id') || '';
    // Return admin if id is 'user-1' (for useUserRole success test)
    if (idFilter.includes('user-1')) {
      return HttpResponse.json([{ id: 'user-1', role: 'admin' }], { status: 200 });
    }
    // Default to user
    return HttpResponse.json([{ id: 'mock-user-id', role: 'user' }], { status: 200 });
  }),

  // --- Edge Functions ---
  http.post(`${BASE}/functions/v1/create-checkout`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.eventId === 'error-event') {
      return HttpResponse.json(
        { error: 'Event not found' }, 
        { status: 404 }
      )
    }

    return HttpResponse.json({
      sessionId: 'cs_test_checkout_session',
      url: 'https://checkout.stripe.com/pay/cs_test_checkout_session'
    }, { status: 200 })
  }),

  http.post(`${BASE}/functions/v1/verify-payment`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.sessionId === 'cs_failed_session') {
      return HttpResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      payment_status: 'paid',
      registration_id: 'reg-verified'
    }, { status: 200 })
  }),

  // --- Error handlers ---
  http.get(`${BASE}/rest/v1/events-error`, () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }),

  // --- Network delay simulation ---
  http.get(`${BASE}/rest/v1/events-slow`, async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json(mockEvents, { status: 200 })
  })
]

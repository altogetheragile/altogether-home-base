
import { http, HttpResponse } from 'msw'
import { mockEvent, mockRegistration, mockEvents } from '../../fixtures/mockEventData'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const eventHandlers = [
  // Events list with filtering and pagination
  http.get(`${BASE}/rest/v1/events`, ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    if (idParam && (idParam.includes('event-1') || idParam.startsWith('in.') || idParam.startsWith('eq.'))) {
      return HttpResponse.json([mockEvent], { status: 200 })
    }

    let events = mockEvents
    if (limit) {
      const limitNum = parseInt(limit)
      const offsetNum = parseInt(offset || '0')
      events = events.slice(offsetNum, offsetNum + limitNum)
    }

    return HttpResponse.json(events, { status: 200 })
  }),
  // Event registrations with joined event
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
]

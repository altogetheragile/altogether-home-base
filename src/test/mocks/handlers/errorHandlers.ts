
import { http, HttpResponse } from 'msw'
import { mockEvents } from '../../fixtures/mockEventData'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const errorHandlers = [
  http.get(`${BASE}/rest/v1/events-error`, () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }),
  http.get(`${BASE}/rest/v1/events-slow`, async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json(mockEvents, { status: 200 })
  })
]


import { http, HttpResponse } from 'msw'
import { mockSession } from '../../fixtures/mockUserData'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const authHandlers = [
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
]


import { http, HttpResponse } from 'msw'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const locationHandlers = [
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
]

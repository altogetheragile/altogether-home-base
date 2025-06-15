
import { http, HttpResponse } from 'msw'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

export const edgeHandlers = [
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
]

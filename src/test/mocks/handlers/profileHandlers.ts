
import { http, HttpResponse } from 'msw'

export const profileHandlers = [
  http.get('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/profiles', ({ request }) => {
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id') || '';
    if (idFilter.includes('user-1')) {
      return HttpResponse.json([{ id: 'user-1', role: 'admin' }], { status: 200 });
    }
    return HttpResponse.json([{ id: 'mock-user-id', role: 'user' }], { status: 200 });
  }),
]

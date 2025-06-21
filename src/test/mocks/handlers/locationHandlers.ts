import { http, HttpResponse } from 'msw'

// Simplified location handlers - these are now mostly unused since we mock hooks globally
export const locationHandlers = [
  // Keep minimal handlers for any direct API calls that might still occur
  http.get('*/locations*', () => {
    return HttpResponse.json([
      { id: 'loc-1', name: 'Main Hall', address: '123 Main St', virtual_url: 'https://zoom.com/main' },
      { id: 'loc-2', name: 'West Room', address: '456 West Blvd', virtual_url: '' },
    ])
  }),
]

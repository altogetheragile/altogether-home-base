
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create server with handlers and better configuration
export const server = setupServer(...handlers)

// Add request logging for debugging
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})

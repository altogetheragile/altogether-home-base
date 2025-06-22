
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'
import { handlers } from '../mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MSW Debug Tests', () => {
  it('should have handlers defined', () => {
    expect(handlers).toBeDefined()
    expect(Array.isArray(handlers)).toBe(true)
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('should have server configured', () => {
    expect(server).toBeDefined()
    expect(typeof server.listen).toBe('function')
    expect(typeof server.resetHandlers).toBe('function')
  })

  it('should be able to make mock requests', async () => {
    // Simple test to verify MSW is intercepting requests
    const response = await fetch('https://wqaplkypnetifpqrungv.supabase.co/rest/v1/events')
    expect(response).toBeDefined()
  })
})

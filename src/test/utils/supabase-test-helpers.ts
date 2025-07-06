import { vi } from 'vitest'

// Mock for chained Supabase calls
export const createMockSupabaseClient = (responses: Record<string, any> = {}) => ({
  from: vi.fn((table: string) => {
    const response = responses[table] || { 
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis()
    }
    return response
  }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  }
})

// Helper for mock fetch responses (for hooks that use fetch directly)
export const createMockFetchResponse = (data: any, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  status: ok ? 200 : 400
})
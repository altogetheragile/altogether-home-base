import { vi } from 'vitest'

// Enhanced mock Supabase response factory
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data, error }),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error }),
  insert: vi.fn().mockResolvedValue({ data, error }),
  update: vi.fn().mockResolvedValue({ data, error }),
  delete: vi.fn().mockResolvedValue({ data, error }),
  from: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis()
})

// Mock for chained Supabase calls
export const createMockSupabaseClient = (responses: Record<string, any> = {}) => ({
  from: vi.fn((table: string) => {
    const response = responses[table] || createMockSupabaseResponse([])
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
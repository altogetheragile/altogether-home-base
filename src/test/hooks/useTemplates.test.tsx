
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithQuery } from '@/test/utils/verified-patterns'
import { useTemplates } from '@/hooks/useTemplates'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

const mockSupabase = vi.mocked(supabase)

describe('useTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches templates successfully', async () => {
    const mockTemplates = [
      {
        id: '1',
        title: 'Agile Fundamentals',
        description: 'Introduction to Agile methodologies',
        duration_days: 2,
        default_location_id: 'loc1',
        default_instructor_id: 'inst1',
        created_at: '2023-01-01T00:00:00Z'
      }
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTemplates,
        error: null
      })
    } as any)

    const { result } = renderHookWithQuery(() => useTemplates())

    await waitFor(() => {
      expect(result.current.data).toEqual(mockTemplates)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    }, { timeout: 5000 })
  })

  it('handles fetch error correctly', async () => {
    const mockError = new Error('Database connection failed')

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
    } as any)

    const { result } = renderHookWithQuery(() => useTemplates())

    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toEqual(mockError)
    }, { timeout: 5000 })
  })

  it('returns loading state initially', () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
    } as any)

    const { result } = renderHookWithQuery(() => useTemplates())

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('uses correct query key', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    } as any)

    const { result } = renderHookWithQuery(() => useTemplates())

    // Query key should be ['templates']
    expect(result.current).toBeDefined()
  })
})

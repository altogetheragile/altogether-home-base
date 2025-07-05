
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, createWrapper } from '../test-utils'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}))

const mockSupabase = vi.mocked(supabase)
const mockUseToast = vi.mocked(useToast)
const mockToast = vi.fn()

describe('useTemplateMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    })
  })

  describe('createTemplate', () => {
    it('creates template successfully', async () => {
      const mockTemplate = {
        id: '1',
        title: 'New Template',
        description: 'Description',
        duration_days: 2,
        default_location_id: 'loc1',
        default_instructor_id: 'inst1',
        created_by: 'user123',
        updated_by: 'user123'
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTemplate,
          error: null
        })
      } as any)

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper()
    })

      await result.current.createTemplate.mutateAsync({
        title: 'New Template',
        description: 'Description',
        duration_days: 2,
        default_location_id: 'loc1',
        default_instructor_id: 'inst1'
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Template created successfully'
        })
      })
    })

    it('handles create error correctly', async () => {
      const mockError = new Error('Creation failed')

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      } as any)

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper()
    })

      try {
        await result.current.createTemplate.mutateAsync({
          title: 'New Template',
          duration_days: 2
        })
      } catch (error) {
        expect(error).toEqual(mockError)
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Creation failed',
          variant: 'destructive'
        })
      })
    })
  })

  describe('updateTemplate', () => {
    it('updates template successfully', async () => {
      const mockTemplate = {
        id: '1',
        title: 'Updated Template',
        description: 'Updated Description',
        duration_days: 3,
        updated_by: 'user123'
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTemplate,
          error: null
        })
      } as any)

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper()
    })

      await result.current.updateTemplate.mutateAsync({
        id: '1',
        data: {
          title: 'Updated Template',
          description: 'Updated Description',
          duration_days: 3
        }
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Template updated successfully'
        })
      })
    })
  })

  describe('deleteTemplate', () => {
    it('deletes template successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      } as any)

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper()
    })

      await result.current.deleteTemplate.mutateAsync('1')

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Template deleted successfully'
        })
      })
    })

    it('handles delete error correctly', async () => {
      const mockError = new Error('Delete failed')

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: mockError
        })
      } as any)

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper()
    })

      try {
        await result.current.deleteTemplate.mutateAsync('1')
      } catch (error) {
        expect(error).toEqual(mockError)
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Delete failed',
          variant: 'destructive'
        })
      })
    })
  })
})

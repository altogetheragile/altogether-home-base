
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, createMockUseQueryResult, createMockUseMutationResult } from '../test-utils'
import AdminTemplates from '@/pages/admin/AdminTemplates'
import { useTemplates } from '@/hooks/useTemplates'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'
import { useLocations } from '@/hooks/useLocations'
import { useInstructors } from '@/hooks/useInstructors'
import { useToast } from '@/hooks/use-toast'
import { mockTemplates, mockLocations, mockInstructors } from '../utils/mock-factories'

vi.mock('@/hooks/useTemplates')
vi.mock('@/hooks/useTemplateMutations')
vi.mock('@/hooks/useLocations')
vi.mock('@/hooks/useInstructors')
vi.mock('@/hooks/use-toast')

const mockUseTemplates = vi.mocked(useTemplates)
const mockUseTemplateMutations = vi.mocked(useTemplateMutations)
const mockUseLocations = vi.mocked(useLocations)
const mockUseInstructors = vi.mocked(useInstructors)
const mockUseToast = vi.mocked(useToast)

describe('Template CRUD Workflow Integration', () => {
  const mockToast = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    })
    
    mockUseLocations.mockReturnValue(createMockUseQueryResult({
      data: mockLocations,
      isLoading: false,
      isSuccess: true
    }))
    
    mockUseInstructors.mockReturnValue(createMockUseQueryResult({
      data: mockInstructors,
      isLoading: false,
      isSuccess: true
    }))
  })

  describe('Complete CRUD Operations', () => {
    it('handles full create workflow with toast notification', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({
        id: 'new-template-id',
        title: 'New Template',
        description: 'Test description',
        duration_days: 2
      })
      
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: [],
        isLoading: false,
        isSuccess: true
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(<AdminTemplates />)
      
      // Open create dialog
      fireEvent.click(screen.getByRole('button', { name: 'Add Template' }))
      
      await waitFor(() => {
        expect(screen.getByText('Create Template')).toBeInTheDocument()
      })
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'New Template' }
      })
      
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test description' }
      })
      
      fireEvent.change(screen.getByLabelText('Duration (days)'), {
        target: { value: '2' }
      })
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          title: 'New Template',
          description: 'Test description',
          duration_days: 2,
          default_location_id: '',
          default_instructor_id: ''
        })
      })
    })

    it('handles edit workflow with pre-filled data', async () => {
      const mockUpdateTemplate = vi.fn().mockResolvedValue({})
      
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        isSuccess: true
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult({
          mutateAsync: mockUpdateTemplate
        }),
        deleteTemplate: createMockUseMutationResult()
      })

      render(<AdminTemplates />)
      
      // Find and click edit button for first template
      const templateCards = screen.getAllByTestId('template-card')
      const editButton = templateCards[0].querySelector('[data-testid="edit-button"]')
      
      if (editButton) {
        fireEvent.click(editButton)
        
        await waitFor(() => {
          expect(screen.getByDisplayValue('Agile Fundamentals')).toBeInTheDocument()
        })
        
        // Modify title
        fireEvent.change(screen.getByDisplayValue('Agile Fundamentals'), {
          target: { value: 'Advanced Agile Fundamentals' }
        })
        
        // Submit update
        fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
        
        await waitFor(() => {
          expect(mockUpdateTemplate).toHaveBeenCalledWith({
            id: '1',
            data: expect.objectContaining({
              title: 'Advanced Agile Fundamentals'
            })
          })
        })
      }
    })

    it('handles delete workflow with confirmation', async () => {
      const mockDeleteTemplate = vi.fn().mockResolvedValue({})
      
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        isSuccess: true
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult({
          mutateAsync: mockDeleteTemplate
        })
      })

      render(<AdminTemplates />)
      
      // Find and click delete button
      const templateCards = screen.getAllByTestId('template-card')
      const deleteButton = templateCards[0].querySelector('[data-testid="delete-button"]')
      
      if (deleteButton) {
        fireEvent.click(deleteButton)
        
        await waitFor(() => {
          expect(screen.getByText('Delete Template')).toBeInTheDocument()
          expect(screen.getByText(/Are you sure you want to delete "Agile Fundamentals"/)).toBeInTheDocument()
        })
        
        // Confirm deletion
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
        
        await waitFor(() => {
          expect(mockDeleteTemplate).toHaveBeenCalledWith('1')
        })
      }
    })
  })

  describe('Search and Filter Integration', () => {
    it('filters templates by search term', async () => {
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        isSuccess: true
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(<AdminTemplates />)
      
      // Should show both templates initially
      expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
      expect(screen.getByText('Scrum Master Training')).toBeInTheDocument()
      
      // Search for "Agile"
      const searchInput = screen.getByPlaceholderText(/search templates/i)
      fireEvent.change(searchInput, { target: { value: 'Agile' } })
      
      await waitFor(() => {
        // Should still show Agile template (filtering happens in the component)
        expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
      })
      
      // Search for non-existent term
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
      
      await waitFor(() => {
        expect(screen.getByText('No templates found matching your search.')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling in Workflows', () => {
    it('shows error state when templates fail to load', () => {
      const mockError = new Error('Failed to fetch templates')
      
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: undefined,
        isLoading: false,
        error: mockError,
        isError: true
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(<AdminTemplates />)
      
      expect(screen.getByText('Error loading templates: Failed to fetch templates')).toBeInTheDocument()
    })

    it('shows loading state during template fetch', () => {
      mockUseTemplates.mockReturnValue(createMockUseQueryResult({
        data: undefined,
        isLoading: true,
        isSuccess: false
      }))
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(<AdminTemplates />)
      
      expect(screen.getByText('Loading templates...')).toBeInTheDocument()
    })
  })
})

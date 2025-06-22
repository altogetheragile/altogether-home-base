
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, createMockUseMutationResult } from '../../../test-utils'
import TemplateForm from '@/components/admin/templates/TemplateForm'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'

vi.mock('@/hooks/useTemplateMutations')

const mockUseTemplateMutations = vi.mocked(useTemplateMutations)

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' },
  { id: 'loc2', name: 'Virtual Room' },
  { id: 'loc3', name: 'Training Center B' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' },
  { id: 'inst2', name: 'Jane Smith' },
  { id: 'inst3', name: 'Mike Johnson' }
]

const mockTemplate = {
  id: '1',
  title: 'Agile Fundamentals',
  description: 'Introduction to Agile methodologies',
  duration_days: 2,
  default_location_id: 'loc1',
  default_instructor_id: 'inst1',
  created_at: '2023-01-01T00:00:00Z'
}

describe('TemplateForm - Comprehensive Tests', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })
  })

  describe('Rendering Tests', () => {
    it('renders create form with all required fields', () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByLabelText('Template Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Duration (days)')).toBeInTheDocument()
      expect(screen.getByLabelText('Default Location')).toBeInTheDocument()
      expect(screen.getByLabelText('Default Instructor')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Template' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('renders edit form with pre-filled data', () => {
      render(
        <TemplateForm
          template={mockTemplate}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByDisplayValue('Agile Fundamentals')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Introduction to Agile methodologies')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Update Template' })).toBeInTheDocument()
    })

    it('renders locations dropdown with all options', () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const locationSelect = screen.getByLabelText('Default Location')
      fireEvent.click(locationSelect)
      
      expect(screen.getByText('Conference Room A')).toBeInTheDocument()
      expect(screen.getByText('Virtual Room')).toBeInTheDocument()
      expect(screen.getByText('Training Center B')).toBeInTheDocument()
      expect(screen.getByText('No default location')).toBeInTheDocument()
    })

    it('renders instructors dropdown with all options', () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const instructorSelect = screen.getByLabelText('Default Instructor')
      fireEvent.click(instructorSelect)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
      expect(screen.getByText('No default instructor')).toBeInTheDocument()
    })
  })

  describe('Form Validation Tests', () => {
    it('requires title field', async () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: 'Create Template' })
      fireEvent.click(submitButton)
      
      // Form should not submit without required title
      await waitFor(() => {
        expect(mockUseTemplateMutations().createTemplate.mutateAsync).not.toHaveBeenCalled()
      })
    })

    it('requires duration field to be at least 1', async () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const durationInput = screen.getByLabelText('Duration (days)')
      fireEvent.change(durationInput, { target: { value: '0' } })
      
      const submitButton = screen.getByRole('button', { name: 'Create Template' })
      fireEvent.click(submitButton)
      
      // Form should not submit with invalid duration
      await waitFor(() => {
        expect(mockUseTemplateMutations().createTemplate.mutateAsync).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission Tests', () => {
    it('submits create form with valid data', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({})
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'New Template' }
      })
      
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test description' }
      })
      
      fireEvent.change(screen.getByLabelText('Duration (days)'), {
        target: { value: '3' }
      })
      
      const submitButton = screen.getByRole('button', { name: 'Create Template' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          title: 'New Template',
          description: 'Test description',
          duration_days: 3,
          default_location_id: '',
          default_instructor_id: ''
        })
      })
    })

    it('submits update form with modified data', async () => {
      const mockUpdateTemplate = vi.fn().mockResolvedValue({})
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult({
          mutateAsync: mockUpdateTemplate
        }),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={mockTemplate}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByDisplayValue('Agile Fundamentals'), {
        target: { value: 'Advanced Agile Fundamentals' }
      })
      
      const submitButton = screen.getByRole('button', { name: 'Update Template' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith({
          id: '1',
          data: {
            title: 'Advanced Agile Fundamentals',
            description: 'Introduction to Agile methodologies',
            duration_days: 2,
            default_location_id: 'loc1',
            default_instructor_id: 'inst1'
          }
        })
      })
    })

    it('calls onClose after successful submission', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({})
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'New Template' }
      })
      
      const submitButton = screen.getByRole('button', { name: 'Create Template' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States Tests', () => {
    it('shows loading state during creation', () => {
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          isPending: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })

    it('shows loading state during update', () => {
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult(),
        updateTemplate: createMockUseMutationResult({
          isPending: true
        }),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={mockTemplate}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })

    it('disables form fields during loading', () => {
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          isPending: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByLabelText('Template Title')).toBeDisabled()
      expect(screen.getByLabelText('Description')).toBeDisabled()
      expect(screen.getByLabelText('Duration (days)')).toBeDisabled()
    })
  })

  describe('Error Handling Tests', () => {
    it('handles submission errors gracefully', async () => {
      const mockCreateTemplate = vi.fn().mockRejectedValue(new Error('Network error'))
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'Test Template' }
      })
      
      const submitButton = screen.getByRole('button', { name: 'Create Template' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Cancel Button Tests', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Edge Cases Tests', () => {
    it('handles empty locations array', () => {
      render(
        <TemplateForm
          template={null}
          locations={[]}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      const locationSelect = screen.getByLabelText('Default Location')
      fireEvent.click(locationSelect)
      
      expect(screen.getByText('No default location')).toBeInTheDocument()
    })

    it('handles empty instructors array', () => {
      render(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={[]}
          onClose={mockOnClose}
        />
      )
      
      const instructorSelect = screen.getByLabelText('Default Instructor')
      fireEvent.click(instructorSelect)
      
      expect(screen.getByText('No default instructor')).toBeInTheDocument()
    })

    it('handles template with null description', () => {
      const templateWithNullDescription = {
        ...mockTemplate,
        description: undefined
      }

      render(
        <TemplateForm
          template={templateWithNullDescription}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByLabelText('Description')).toHaveValue('')
    })
  })
})

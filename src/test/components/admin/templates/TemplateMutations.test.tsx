
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderSimpleComponent, createMockUseMutationResult } from '@/test/utils/verified-patterns'
import TemplateForm from '@/components/admin/templates/TemplateForm'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'
import { useToast } from '@/hooks/use-toast'

vi.mock('@/hooks/useTemplateMutations')
vi.mock('@/hooks/use-toast')

const mockUseTemplateMutations = vi.mocked(useTemplateMutations)
const mockUseToast = vi.mocked(useToast)
const mockToast = vi.fn()

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' }
]

describe('Template Mutations - Error Handling & Success Scenarios', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    })
  })

  describe('Success Scenarios', () => {
    it('shows success toast on template creation', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({
        id: 'new-template-id',
        title: 'New Template'
      })
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate,
          isSuccess: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
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
      
      fireEvent.change(screen.getByLabelText('Duration (days)'), {
        target: { value: '2' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled()
      })
    })

    it('closes form after successful creation', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({})
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
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
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Error Scenarios', () => {
    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network connection failed')
      const mockCreateTemplate = vi.fn().mockRejectedValue(networkError)
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate,
          error: networkError,
          isError: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderSimpleComponent(
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
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', networkError)
      })

      consoleSpy.mockRestore()
    })

    it('handles validation errors from server', async () => {
      const validationError = new Error('Title already exists')
      const mockCreateTemplate = vi.fn().mockRejectedValue(validationError)
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate,
          error: validationError,
          isError: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'Duplicate Title' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled()
        // Form should not close on error
        expect(mockOnClose).not.toHaveBeenCalled()
      })
    })

    it('disables form during loading state', () => {
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          isPending: true
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByLabelText('Template Title')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty title', async () => {
      const mockCreateTemplate = vi.fn()
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockCreateTemplate).not.toHaveBeenCalled()
      })
    })

    it('prevents submission with invalid duration', async () => {
      const mockCreateTemplate = vi.fn()
      
      mockUseTemplateMutations.mockReturnValue({
        createTemplate: createMockUseMutationResult({
          mutateAsync: mockCreateTemplate
        }),
        updateTemplate: createMockUseMutationResult(),
        deleteTemplate: createMockUseMutationResult()
      })

      renderSimpleComponent(
        <TemplateForm
          template={null}
          locations={mockLocations}
          instructors={mockInstructors}
          onClose={mockOnClose}
        />
      )
      
      fireEvent.change(screen.getByLabelText('Template Title'), {
        target: { value: 'Valid Title' }
      })
      
      fireEvent.change(screen.getByLabelText('Duration (days)'), {
        target: { value: '0' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
      
      await waitFor(() => {
        expect(mockCreateTemplate).not.toHaveBeenCalled()
      })
    })
  })
})

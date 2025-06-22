
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test-utils'
import TemplateForm from '@/components/admin/templates/TemplateForm'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'
import { createMockUseMutationResult } from '../../../utils/mock-factories'

vi.mock('@/hooks/useTemplateMutations')

const mockUseTemplateMutations = vi.mocked(useTemplateMutations)

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' },
  { id: 'loc2', name: 'Virtual Room' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' },
  { id: 'inst2', name: 'Jane Smith' }
]

describe('TemplateForm Scaffold', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })
  })

  it('should render create form without crashing', () => {
    render(
      <TemplateForm
        template={null}
        locations={mockLocations}
        instructors={mockInstructors}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByLabelText('Template Title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Template' })).toBeInTheDocument()
  })

  it('should handle form input changes', () => {
    render(
      <TemplateForm
        template={null}
        locations={mockLocations}
        instructors={mockInstructors}
        onClose={mockOnClose}
      />
    )
    
    const titleInput = screen.getByLabelText('Template Title')
    fireEvent.change(titleInput, { target: { value: 'Test Template' } })
    
    expect(titleInput).toHaveValue('Test Template')
  })
})

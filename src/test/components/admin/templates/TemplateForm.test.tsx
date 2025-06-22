
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test-utils'
import TemplateForm from '@/components/admin/templates/TemplateForm'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'

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

const mockTemplate = {
  id: '1',
  title: 'Agile Fundamentals',
  description: 'Introduction to Agile methodologies',
  duration_days: 2,
  default_location_id: 'loc1',
  default_instructor_id: 'inst1',
  created_at: '2023-01-01T00:00:00Z'
}

describe('TemplateForm', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      },
      updateTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      },
      deleteTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      }
    })
  })

  it('renders create form correctly', () => {
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
    expect(screen.getByRole('button', { name: 'Create Template' })).toBeInTheDocument()
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

  it('validates required fields', async () => {
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
    
    // Form should not submit without required fields
    await waitFor(() => {
      expect(mockUseTemplateMutations().createTemplate.mutateAsync).not.toHaveBeenCalled()
    })
  })

  it('submits create form with valid data', async () => {
    const mockCreateTemplate = vi.fn().mockResolvedValue({})
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: {
        mutateAsync: mockCreateTemplate,
        isPending: false
      },
      updateTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      },
      deleteTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      }
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
    
    fireEvent.change(screen.getByLabelText('Duration (days)'), {
      target: { value: '3' }
    })
    
    const submitButton = screen.getByRole('button', { name: 'Create Template' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        title: 'New Template',
        description: '',
        duration_days: 3,
        default_location_id: '',
        default_instructor_id: ''
      })
    })
  })

  it('submits update form with modified data', async () => {
    const mockUpdateTemplate = vi.fn().mockResolvedValue({})
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      },
      updateTemplate: {
        mutateAsync: mockUpdateTemplate,
        isPending: false
      },
      deleteTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      }
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
      target: { value: 'Updated Agile Fundamentals' }
    })
    
    const submitButton = screen.getByRole('button', { name: 'Update Template' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockUpdateTemplate).toHaveBeenCalledWith({
        id: '1',
        data: {
          title: 'Updated Agile Fundamentals',
          description: 'Introduction to Agile methodologies',
          duration_days: 2,
          default_location_id: 'loc1',
          default_instructor_id: 'inst1'
        }
      })
    })
  })

  it('shows loading state during submission', () => {
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: {
        mutateAsync: vi.fn(),
        isPending: true
      },
      updateTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      },
      deleteTemplate: {
        mutateAsync: vi.fn(),
        isPending: false
      }
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
  })

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

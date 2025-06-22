import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, createMockUseMutationResult } from '../../../test-utils'
import TemplateCard from '@/components/admin/templates/TemplateCard'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'

vi.mock('@/hooks/useTemplateMutations')

const mockUseTemplateMutations = vi.mocked(useTemplateMutations)

const mockTemplate = {
  id: '1',
  title: 'Agile Fundamentals',
  description: 'Introduction to Agile methodologies',
  duration_days: 2,
  default_location_id: 'loc1',
  default_instructor_id: 'inst1',
  created_at: '2023-01-01T00:00:00Z'
}

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' },
  { id: 'loc2', name: 'Virtual Room' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' },
  { id: 'inst2', name: 'Jane Smith' }
]

describe('TemplateCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnCreateEvent = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })
  })

  it('renders template information correctly', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={mockOnEdit}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Introduction to Agile methodologies')).toBeInTheDocument()
    expect(screen.getByText('Duration: 2 day(s)')).toBeInTheDocument()
    expect(screen.getByText('Default Location: Conference Room A')).toBeInTheDocument()
    expect(screen.getByText('Default Instructor: John Doe')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={mockOnEdit}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const editButton = screen.getAllByRole('button')[0] // First button should be edit
    fireEvent.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTemplate)
  })

  it('calls onCreateEvent when create event button is clicked', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={mockOnEdit}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const createEventButton = screen.getByText('Create Event from Template')
    fireEvent.click(createEventButton)
    
    expect(mockOnCreateEvent).toHaveBeenCalledWith(mockTemplate)
  })

  it('shows delete confirmation dialog', async () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={mockOnEdit}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const deleteButton = screen.getAllByRole('button')[2] // Third button should be delete
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Delete Template')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete "Agile Fundamentals"? This action cannot be undone.')).toBeInTheDocument()
    })
  })

  it('deletes template when confirmed', async () => {
    const mockDeleteTemplate = vi.fn().mockResolvedValue({})
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult({
        mutateAsync: mockDeleteTemplate
      })
    })

    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={mockOnEdit}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const deleteButton = screen.getAllByRole('button')[2]
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(confirmButton)
    })
    
    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith('1')
    })
  })
})

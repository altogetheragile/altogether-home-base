
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../../test-utils'
import TemplatesList from '@/components/admin/templates/TemplatesList'

const mockTemplates = [
  {
    id: '1',
    title: 'Agile Fundamentals',
    description: 'Introduction to Agile methodologies',
    duration_days: 2,
    default_location_id: 'loc1',
    default_instructor_id: 'inst1',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Scrum Master Training',
    description: 'Advanced Scrum Master certification',
    duration_days: 3,
    default_location_id: 'loc2',
    default_instructor_id: 'inst2',
    created_at: '2023-01-02T00:00:00Z'
  }
]

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' },
  { id: 'loc2', name: 'Virtual Room' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' },
  { id: 'inst2', name: 'Jane Smith' }
]

describe('TemplatesList', () => {
  const mockOnEditTemplate = vi.fn()
  const mockOnCreateEvent = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders templates correctly', () => {
    render(
      <TemplatesList
        templates={mockTemplates}
        locations={mockLocations}
        instructors={mockInstructors}
        onEditTemplate={mockOnEditTemplate}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Scrum Master Training')).toBeInTheDocument()
    expect(screen.getByText('Introduction to Agile methodologies')).toBeInTheDocument()
    expect(screen.getByText('Advanced Scrum Master certification')).toBeInTheDocument()
  })

  it('shows empty state when no templates', () => {
    render(
      <TemplatesList
        templates={[]}
        locations={mockLocations}
        instructors={mockInstructors}
        onEditTemplate={mockOnEditTemplate}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    expect(screen.getByText('No templates found matching your search.')).toBeInTheDocument()
  })

  it('calls onEditTemplate when edit button is clicked', () => {
    render(
      <TemplatesList
        templates={mockTemplates}
        locations={mockLocations}
        instructors={mockInstructors}
        onEditTemplate={mockOnEditTemplate}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') !== 'Delete'
    )
    
    if (editButton) {
      fireEvent.click(editButton)
      expect(mockOnEditTemplate).toHaveBeenCalledWith(mockTemplates[0])
    }
  })

  it('calls onCreateEvent when create event button is clicked', () => {
    render(
      <TemplatesList
        templates={mockTemplates}
        locations={mockLocations}
        instructors={mockInstructors}
        onEditTemplate={mockOnEditTemplate}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const createEventButtons = screen.getAllByText('Create Event from Template')
    fireEvent.click(createEventButtons[0])
    
    expect(mockOnCreateEvent).toHaveBeenCalledWith(mockTemplates[0])
  })

  it('renders correct grid layout', () => {
    const { container } = render(
      <TemplatesList
        templates={mockTemplates}
        locations={mockLocations}
        instructors={mockInstructors}
        onEditTemplate={mockOnEditTemplate}
        onCreateEvent={mockOnCreateEvent}
      />
    )
    
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')
  })
})

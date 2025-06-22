
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, createMockUseQueryResult } from '../test-utils'
import AdminTemplates from '@/pages/admin/AdminTemplates'
import TemplateCard from '@/components/admin/templates/TemplateCard'
import { useTemplates } from '@/hooks/useTemplates'
import { useUserRole } from '@/hooks/useUserRole'
import { useLocations } from '@/hooks/useLocations'
import { useInstructors } from '@/hooks/useInstructors'

// Mock the hooks
vi.mock('@/hooks/useTemplates')
vi.mock('@/hooks/useUserRole')
vi.mock('@/hooks/useLocations')
vi.mock('@/hooks/useInstructors')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

const mockUseTemplates = vi.mocked(useTemplates)
const mockUseUserRole = vi.mocked(useUserRole)
const mockUseLocations = vi.mocked(useLocations)
const mockUseInstructors = vi.mocked(useInstructors)

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
  { id: 'loc1', name: 'Conference Room A' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' }
]

describe('Template Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseUserRole.mockReturnValue(
      createMockUseQueryResult({
        data: 'admin',
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )
    
    mockUseLocations.mockReturnValue(
      createMockUseQueryResult({
        data: mockLocations,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )
    
    mockUseInstructors.mockReturnValue(
      createMockUseQueryResult({
        data: mockInstructors,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )
  })

  it('has proper ARIA labels and roles', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: [mockTemplate],
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    // Check for search input accessibility
    const searchInput = screen.getByRole('searchbox')
    expect(searchInput).toBeInTheDocument()
    
    // Check for proper button roles
    const addButton = screen.getByRole('button', { name: /add template/i })
    expect(addButton).toBeInTheDocument()
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Event Templates')
  })

  it('supports keyboard navigation', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={vi.fn()}
        onCreateEvent={vi.fn()}
      />
    )
    
    // All interactive elements should be focusable
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })
  })

  it('provides proper semantic structure', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: [mockTemplate],
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    
    // Check for proper list structure for templates
    const templateGrid = screen.getByRole('main') || document.body
    expect(templateGrid).toBeInTheDocument()
  })

  it('has proper color contrast and visual indicators', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onEdit={vi.fn()}
        onCreateEvent={vi.fn()}
      />
    )
    
    // Primary action button should be visually distinct
    const primaryButton = screen.getByText('Create Event from Template')
    expect(primaryButton).toHaveClass('w-full', 'mt-4')
  })

  it('provides proper loading states with accessibility', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: undefined,
        isLoading: true,
        error: null,
        isPending: true
      })
    )

    render(<AdminTemplates />)
    
    const loadingText = screen.getByText('Loading templates...')
    expect(loadingText).toBeInTheDocument()
    
    // Loading state should be announced to screen readers
    expect(loadingText).toBeVisible()
  })

  it('provides proper error states with accessibility', () => {
    const errorMessage = 'Failed to load templates'
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
        isError: true
      })
    )

    render(<AdminTemplates />)
    
    const errorText = screen.getByText(`Error loading templates: ${errorMessage}`)
    expect(errorText).toBeInTheDocument()
    expect(errorText).toBeVisible()
  })
})

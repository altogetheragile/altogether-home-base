
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, createMockUseQueryResult } from '../../test-utils'
import AdminTemplates from '@/pages/admin/AdminTemplates'
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

describe('AdminTemplates', () => {
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

  it('renders template list without error', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    expect(screen.getByText('Event Templates')).toBeInTheDocument()
    expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Scrum Master Training')).toBeInTheDocument()
  })

  it('shows loading state while fetching templates', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: undefined,
        isLoading: true,
        error: null,
        isPending: true
      })
    )

    render(<AdminTemplates />)
    
    expect(screen.getByText('Loading templates...')).toBeInTheDocument()
  })

  it('shows error state when template loading fails', () => {
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
    
    expect(screen.getByText(`Error loading templates: ${errorMessage}`)).toBeInTheDocument()
  })

  it('filters templates based on search term', async () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Agile' } })
    
    await waitFor(() => {
      expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
      expect(screen.queryByText('Scrum Master Training')).not.toBeInTheDocument()
    })
  })

  it('opens create template dialog when Add Template button is clicked', async () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    const addButton = screen.getByRole('button', { name: /add template/i })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Create Template')).toBeInTheDocument()
    })
  })

  it('shows empty state when no templates exist', () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: [],
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    expect(screen.getByText('No templates found matching your search.')).toBeInTheDocument()
  })

  it('handles bulk operations selection', async () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    render(<AdminTemplates />)
    
    // Test select all functionality
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
    fireEvent.click(selectAllCheckbox)
    
    await waitFor(() => {
      expect(selectAllCheckbox).toBeChecked()
    })
  })

  it('navigates to create event with template when template card action is clicked', async () => {
    mockUseTemplates.mockReturnValue(
      createMockUseQueryResult({
        data: mockTemplates,
        isLoading: false,
        error: null,
        isSuccess: true
      })
    )

    const mockNavigate = vi.fn()
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate
      }
    })

    render(<AdminTemplates />)
    
    const createEventButtons = screen.getAllByText('Create Event from Template')
    fireEvent.click(createEventButtons[0])
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/events/new?template=1')
  })
})

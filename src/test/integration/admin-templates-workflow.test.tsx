
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter, createMockUseQueryResult, createMockUseMutationResult } from '@/test/utils/verified-patterns'
import AdminTemplates from '@/pages/admin/AdminTemplates'
import { useTemplates } from '@/hooks/useTemplates'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'
import { useLocations } from '@/hooks/useLocations'
import { useInstructors } from '@/hooks/useInstructors'

// Mock the hooks
vi.mock('@/hooks/useTemplates')
vi.mock('@/hooks/useTemplateMutations')
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
const mockUseTemplateMutations = vi.mocked(useTemplateMutations)
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
  }
]

const mockLocations = [
  { id: 'loc1', name: 'Conference Room A' }
]

const mockInstructors = [
  { id: 'inst1', name: 'John Doe' }
]

describe('AdminTemplates Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplates.mockReturnValue(createMockUseQueryResult({
      data: mockTemplates,
      isLoading: false,
      error: null,
      isSuccess: true
    }))
    
    mockUseLocations.mockReturnValue(createMockUseQueryResult({
      data: mockLocations,
      isLoading: false,
      error: null,
      isSuccess: true
    }))
    
    mockUseInstructors.mockReturnValue(createMockUseQueryResult({
      data: mockInstructors,
      isLoading: false,
      error: null,
      isSuccess: true
    }))
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })
  })

  it('renders the admin templates page correctly', () => {
    renderWithRouter(<AdminTemplates />)
    
    expect(screen.getByText('Event Templates')).toBeInTheDocument()
    expect(screen.getByText('Manage reusable event templates')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Template' })).toBeInTheDocument()
  })

  it('displays templates in the list', () => {
    renderWithRouter(<AdminTemplates />)
    
    expect(screen.getByText('Agile Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Introduction to Agile methodologies')).toBeInTheDocument()
  })

  it('opens create template dialog when Add Template button is clicked', async () => {
    renderWithRouter(<AdminTemplates />)
    
    const addButton = screen.getByRole('button', { name: 'Add Template' })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Create Template')).toBeInTheDocument()
      expect(screen.getByLabelText('Template Title')).toBeInTheDocument()
    })
  })

  it('filters templates based on search term', async () => {
    renderWithRouter(<AdminTemplates />)
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Scrum' } })
    
    await waitFor(() => {
      expect(screen.getByText('No templates found matching your search.')).toBeInTheDocument()
    })
  })

  it('shows loading state when templates are loading', () => {
    mockUseTemplates.mockReturnValue(createMockUseQueryResult({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false
    }))
    
    renderWithRouter(<AdminTemplates />)
    
    expect(screen.getByText('Loading templates...')).toBeInTheDocument()
  })

  it('shows error state when there is an error', () => {
    const mockError = new Error('Failed to load templates')
    mockUseTemplates.mockReturnValue(createMockUseQueryResult({
      data: undefined,
      isLoading: false,
      error: mockError,
      isSuccess: false
    }))
    
    renderWithRouter(<AdminTemplates />)
    
    expect(screen.getByText('Error loading templates: Failed to load templates')).toBeInTheDocument()
  })

  it('handles bulk operations correctly', () => {
    renderWithRouter(<AdminTemplates />)
    
    // Should show bulk operations component
    expect(screen.getByText(/0 selected/)).toBeInTheDocument()
  })
})

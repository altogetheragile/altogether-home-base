
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, createMockUseQueryResult, createMockUseMutationResult } from '../test-utils'
import AdminTemplates from '@/pages/admin/AdminTemplates'
import CreateEvent from '@/pages/admin/CreateEvent'
import { useTemplates } from '@/hooks/useTemplates'
import { useUserRole } from '@/hooks/useUserRole'
import { useLocations } from '@/hooks/useLocations'
import { useInstructors } from '@/hooks/useInstructors'
import { useEventForm } from '@/hooks/useEventForm'

// Mock all the required hooks
vi.mock('@/hooks/useTemplates')
vi.mock('@/hooks/useUserRole')
vi.mock('@/hooks/useLocations')
vi.mock('@/hooks/useInstructors')
vi.mock('@/hooks/useEventForm')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams('template=1')]
  }
})

const mockUseTemplates = vi.mocked(useTemplates)
const mockUseUserRole = vi.mocked(useUserRole)
const mockUseLocations = vi.mocked(useLocations)
const mockUseInstructors = vi.mocked(useInstructors)
const mockUseEventForm = vi.mocked(useEventForm)

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

describe('Template to Event Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseUserRole.mockReturnValue(createMockUseQueryResult({
      data: 'admin',
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
    
    mockUseTemplates.mockReturnValue(createMockUseQueryResult({
      data: [mockTemplate],
      isLoading: false,
      error: null,
      isSuccess: true
    }))
  })

  it('creates event from template with pre-filled form data', () => {
    mockUseEventForm.mockReturnValue({
      formData: {
        title: 'Agile Fundamentals',
        description: 'Introduction to Agile methodologies',
        start_date: '',
        end_date: '',
        instructor_id: 'inst1',
        location_id: 'loc1',
        price_cents: 0,
        currency: 'usd',
        is_published: false,
        template_id: '1',
        capacity: '',
        registration_deadline: '',
        time_zone: '',
        meeting_link: '',
        venue_details: '',
        daily_schedule: '',
        banner_image_url: '',
        seo_slug: '',
        tags: '',
        internal_notes: '',
        course_code: '',
        status: 'draft',
        expected_revenue_cents: 0,
        lead_source: '',
        event_type_id: '',
        category_id: '',
        level_id: '',
        format_id: '',
      },
      selectedTemplate: mockTemplate,
      createEventMutation: createMockUseMutationResult({
        mutate: vi.fn(),
        isPending: false
      }),
      handleSubmit: vi.fn(),
      handleInputChange: vi.fn()
    })

    render(<CreateEvent />)
    
    // Should show template info
    expect(screen.getByText('Create Event from "Agile Fundamentals"')).toBeInTheDocument()
    expect(screen.getByText('Using Template: Agile Fundamentals')).toBeInTheDocument()
    
    // Form should be pre-filled with template data
    expect(screen.getByDisplayValue('Agile Fundamentals')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Introduction to Agile methodologies')).toBeInTheDocument()
  })

  it('shows template duration hint when creating event from template', () => {
    mockUseEventForm.mockReturnValue({
      formData: {
        title: 'Agile Fundamentals',
        description: 'Introduction to Agile methodologies',
        start_date: '2023-12-01',
        end_date: '2023-12-02',
        instructor_id: 'inst1',
        location_id: 'loc1',
        price_cents: 0,
        currency: 'usd',
        is_published: false,
        template_id: '1',
        capacity: '',
        registration_deadline: '',
        time_zone: '',
        meeting_link: '',
        venue_details: '',
        daily_schedule: '',
        banner_image_url: '',
        seo_slug: '',
        tags: '',
        internal_notes: '',
        course_code: '',
        status: 'draft',
        expected_revenue_cents: 0,
        lead_source: '',
        event_type_id: '',
        category_id: '',
        level_id: '',
        format_id: '',
      },
      selectedTemplate: mockTemplate,
      createEventMutation: createMockUseMutationResult({
        mutate: vi.fn(),
        isPending: false
      }),
      handleSubmit: vi.fn(),
      handleInputChange: vi.fn()
    })

    render(<CreateEvent />)
    
    expect(screen.getByText('Auto-calculated based on template duration (2 days)')).toBeInTheDocument()
  })

  it('handles template not found scenario', () => {
    mockUseEventForm.mockReturnValue({
      formData: {
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        instructor_id: '',
        location_id: '',
        price_cents: 0,
        currency: 'usd',
        is_published: false,
        template_id: 'invalid-id',
        capacity: '',
        registration_deadline: '',
        time_zone: '',
        meeting_link: '',
        venue_details: '',
        daily_schedule: '',
        banner_image_url: '',
        seo_slug: '',
        tags: '',
        internal_notes: '',
        course_code: '',
        status: 'draft',
        expected_revenue_cents: 0,
        lead_source: '',
        event_type_id: '',
        category_id: '',
        level_id: '',
        format_id: '',
      },
      selectedTemplate: null,
      createEventMutation: createMockUseMutationResult({
        mutate: vi.fn(),
        isPending: false
      }),
      handleSubmit: vi.fn(),
      handleInputChange: vi.fn()
    })

    render(<CreateEvent />)
    
    // Should show regular create event form without template
    expect(screen.getByText('Create New Event')).toBeInTheDocument()
    expect(screen.getByText('Add a new event to your catalog')).toBeInTheDocument()
  })
})

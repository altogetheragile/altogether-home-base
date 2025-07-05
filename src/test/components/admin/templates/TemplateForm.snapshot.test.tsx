
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderSimpleComponent, createMockUseMutationResult } from '@/test/utils/verified-patterns'
import TemplateForm from '@/components/admin/templates/TemplateForm'
import { useTemplateMutations } from '@/hooks/useTemplateMutations'

vi.mock('@/hooks/useTemplateMutations')
vi.mock('@/hooks/useEventTypes', () => ({
  useEventTypes: () => ({ data: [] })
}))
vi.mock('@/hooks/useEventCategories', () => ({
  useEventCategories: () => ({ data: [] })
}))
vi.mock('@/hooks/useLevels', () => ({
  useLevels: () => ({ data: [] })
}))
vi.mock('@/hooks/useFormats', () => ({
  useFormats: () => ({ data: [] })
}))

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

describe('TemplateForm - Snapshot Tests', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult(),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })
  })

  it('matches snapshot for create form', () => {
    const { container } = renderSimpleComponent(
      <TemplateForm
        template={null}
        locations={mockLocations}
        instructors={mockInstructors}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for edit form', () => {
    const { container } = renderSimpleComponent(
      <TemplateForm
        template={mockTemplate}
        locations={mockLocations}
        instructors={mockInstructors}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for loading state', () => {
    mockUseTemplateMutations.mockReturnValue({
      createTemplate: createMockUseMutationResult({
        isPending: true
      }),
      updateTemplate: createMockUseMutationResult(),
      deleteTemplate: createMockUseMutationResult()
    })

    const { container } = renderSimpleComponent(
      <TemplateForm
        template={null}
        locations={mockLocations}
        instructors={mockInstructors}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with empty locations and instructors', () => {
    const { container } = renderSimpleComponent(
      <TemplateForm
        template={null}
        locations={[]}
        instructors={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })
})

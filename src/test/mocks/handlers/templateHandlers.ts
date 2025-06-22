
import { http, HttpResponse } from 'msw'

const mockTemplates = [
  {
    id: '1',
    title: 'Agile Fundamentals',
    description: 'Introduction to Agile methodologies',
    duration_days: 2,
    default_location_id: 'loc1',
    default_instructor_id: 'inst1',
    created_at: '2023-01-01T00:00:00Z',
    created_by: 'user123',
    updated_by: 'user123'
  },
  {
    id: '2',
    title: 'Scrum Master Training',
    description: 'Advanced Scrum Master certification',
    duration_days: 3,
    default_location_id: 'loc2',
    default_instructor_id: 'inst2',
    created_at: '2023-01-02T00:00:00Z',
    created_by: 'user123',
    updated_by: 'user123'
  }
]

export const templateHandlers = [
  // Get all templates
  http.get('*/rest/v1/event_templates', () => {
    return HttpResponse.json(mockTemplates)
  }),

  // Create template
  http.post('*/rest/v1/event_templates', async ({ request }) => {
    const newTemplate = await request.json() as any
    const template = {
      id: Math.random().toString(36).substr(2, 9),
      ...newTemplate,
      created_at: new Date().toISOString()
    }
    return HttpResponse.json(template, { status: 201 })
  }),

  // Update template
  http.patch('*/rest/v1/event_templates', async ({ request }) => {
    const updatedData = await request.json() as any
    const template = {
      ...mockTemplates[0],
      ...updatedData,
      updated_at: new Date().toISOString()
    }
    return HttpResponse.json(template)
  }),

  // Delete template
  http.delete('*/rest/v1/event_templates', () => {
    return HttpResponse.json({}, { status: 204 })
  }),

  // Error scenarios
  http.get('*/rest/v1/event_templates*error*', () => {
    return HttpResponse.json(
      { message: 'Database connection failed' },
      { status: 500 }
    )
  })
]

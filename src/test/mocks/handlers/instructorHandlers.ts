
import { http, HttpResponse } from 'msw'

const BASE = 'https://wqaplkypnetifpqrungv.supabase.co'

const mockInstructors = [
  {
    id: 'instructor-1',
    name: 'John Smith',
    bio: 'Experienced leadership coach with 10+ years',
    profile_image_url: null
  },
  {
    id: 'instructor-2', 
    name: 'Sarah Johnson',
    bio: 'Expert in team building and communication',
    profile_image_url: 'https://example.com/sarah.jpg'
  },
  {
    id: 'instructor-3',
    name: 'Mike Davis', 
    bio: null,
    profile_image_url: null
  }
]

export const instructorHandlers = [
  // Get all instructors
  http.get(`${BASE}/rest/v1/instructors`, () => {
    return HttpResponse.json(mockInstructors, { status: 200 })
  }),

  // Get single instructor
  http.get(`${BASE}/rest/v1/instructors/:id`, ({ params }) => {
    const instructor = mockInstructors.find(i => i.id === params.id)
    if (!instructor) {
      return HttpResponse.json({ message: 'Instructor not found' }, { status: 404 })
    }
    return HttpResponse.json(instructor, { status: 200 })
  }),

  // Create instructor
  http.post(`${BASE}/rest/v1/instructors`, async ({ request }) => {
    const body = await request.json() as any
    const newInstructor = {
      id: `instructor-${Date.now()}`,
      ...body
    }
    return HttpResponse.json(newInstructor, { status: 201 })
  }),

  // Update instructor
  http.patch(`${BASE}/rest/v1/instructors`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json(body, { status: 200 })
  }),

  // Delete instructor
  http.delete(`${BASE}/rest/v1/instructors`, () => {
    return HttpResponse.json({}, { status: 204 })
  }),

  // Count events for instructor (used for event counts)
  http.get(`${BASE}/rest/v1/events`, ({ request }) => {
    const url = new URL(request.url)
    const instructorId = url.searchParams.get('instructor_id')
    const isCountQuery = url.searchParams.get('head') === 'true'
    
    if (isCountQuery && instructorId) {
      // Mock event counts based on instructor ID
      let count = 0
      if (instructorId === 'instructor-1') count = 3
      else if (instructorId === 'instructor-2') count = 1
      else if (instructorId === 'instructor-3') count = 0
      
      return HttpResponse.json([], { 
        status: 200,
        headers: {
          'Content-Range': `0-0/${count}`
        }
      })
    }
    
    // Return empty array for other event queries
    return HttpResponse.json([], { status: 200 })
  })
]

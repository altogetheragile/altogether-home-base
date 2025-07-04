
import { EventData } from '@/hooks/useEvents'

export const mockEvents: EventData[] = [
  {
    id: 'event-1',
    title: 'Leadership Workshop',
    description: 'A comprehensive leadership development workshop',
    start_date: '2024-03-15',
    end_date: '2024-03-15',
    is_published: true,
    price_cents: 15000,
    currency: 'usd',
    event_type: { name: 'Workshop' },
    category: { name: 'Leadership' },
    level: { name: 'Intermediate' },
    format: { name: 'In-Person' },
    instructor: {
      name: 'Jane Smith',
      bio: 'Certified leadership coach with 10+ years experience'
    },
    location: {
      name: 'Downtown Conference Center',
      address: '123 Business Ave, City, State 12345',
      virtual_url: null
    },
    event_template: {
      duration_days: 1,
      event_types: { name: 'Workshop' },
      formats: { name: 'In-Person' },
      levels: { name: 'Intermediate' }
    }
  },
  {
    id: 'event-2',
    title: 'Virtual Team Building',
    description: 'Remote team building activities and exercises',
    start_date: '2024-04-20',
    end_date: '2024-04-21',
    is_published: true,
    price_cents: 8000,
    currency: 'usd',
    event_type: { name: 'Team Building' },
    category: { name: 'Collaboration' },
    level: { name: 'Beginner' },
    format: { name: 'Virtual' },
    instructor: {
      name: 'Mike Johnson',
      bio: 'Remote work specialist and team dynamics expert'
    },
    location: {
      name: 'Online Event',
      address: null,
      virtual_url: 'https://zoom.us/meeting/123'
    },
    event_template: {
      duration_days: 2,
      event_types: { name: 'Team Building' },
      formats: { name: 'Virtual' },
      levels: { name: 'Beginner' }
    }
  }
]

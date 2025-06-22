
import { z } from 'zod'

export const templateFormSchema = z.object({
  title: z.string().min(1, 'Template title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  duration_days: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration cannot exceed 365 days'),
  default_location_id: z.string().optional(),
  default_instructor_id: z.string().optional(),
})

export type TemplateFormSchema = z.infer<typeof templateFormSchema>

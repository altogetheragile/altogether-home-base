
import { describe, it, expect } from 'vitest'
import { templateFormSchema } from '@/schemas/template'

describe('Template Form Validation Schema', () => {
  it('validates valid template data', () => {
    const validData = {
      title: 'Valid Template',
      description: 'A valid description',
      duration_days: 2,
      default_location_id: 'loc1',
      default_instructor_id: 'inst1'
    }

    const result = templateFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('requires title field', () => {
    const invalidData = {
      description: 'A description',
      duration_days: 2
      // Explicitly excluding title
    }

    const result = templateFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title'])
      expect(result.error.issues[0].message).toBe('Required')
    }
  })

  it('validates title length limits', () => {
    const invalidData = {
      title: 'a'.repeat(256), // Too long
      duration_days: 2
    }

    const result = templateFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title must be less than 255 characters')
    }
  })

  it('validates duration minimum value', () => {
    const invalidData = {
      title: 'Valid Title',
      duration_days: 0 // Invalid
    }

    const result = templateFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Duration must be at least 1 day')
    }
  })

  it('validates duration maximum value', () => {
    const invalidData = {
      title: 'Valid Title',
      duration_days: 366 // Too high
    }

    const result = templateFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Duration cannot exceed 365 days')
    }
  })

  it('validates description length limits', () => {
    const invalidData = {
      title: 'Valid Title',
      description: 'a'.repeat(1001), // Too long
      duration_days: 2
    }

    const result = templateFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description must be less than 1000 characters')
    }
  })

  it('allows optional fields to be undefined', () => {
    const validData = {
      title: 'Valid Template',
      duration_days: 2
      // description, default_location_id, default_instructor_id are optional
    }

    const result = templateFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('allows empty strings for optional fields', () => {
    const validData = {
      title: 'Valid Template',
      description: '',
      duration_days: 2,
      default_location_id: '',
      default_instructor_id: ''
    }

    const result = templateFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

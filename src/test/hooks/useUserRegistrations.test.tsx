
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithQuery } from '@/test/utils/verified-patterns'
import { useUserRegistrations } from '@/hooks/useUserRegistrations'

describe('useUserRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user registrations successfully', async () => {
    const { result } = renderHookWithQuery(() => useUserRegistrations())

    await waitFor(
      () => expect(result.current.isSuccess).toBe(true),
      { timeout: 3000 }
    )

    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'reg-1',
      event_id: 'event-1',
      payment_status: 'paid',
    })
    expect(result.current.data?.[0].event?.title).toBe('Test Event')
  })

  it('should handle loading state', () => {
    const { result } = renderHookWithQuery(() => useUserRegistrations())
    expect(result.current.isLoading).toBe(true)
  })
})

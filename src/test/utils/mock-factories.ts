
import { vi } from 'vitest'
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// Mock user data for auth context (using global mock from setup.tsx)
export const mockAuthContextValue = {
  user: {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'test@example.com'
  },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}

// Mock UseQueryResult factory function with proper typing
export const createMockUseQueryResult = <T = any>(
  overrides: Partial<UseQueryResult<T, Error>> = {}
): UseQueryResult<T, Error> => {
  const baseResult = {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isLoadingError: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: false,
    status: 'pending' as const,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle' as const,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides
  }

  // Adjust status and boolean flags based on the provided overrides
  if (overrides.isLoading || overrides.isPending) {
    baseResult.status = 'pending'
    baseResult.isPending = true
    baseResult.isLoading = overrides.isLoading ?? false
  } else if (overrides.error || overrides.isError) {
    baseResult.status = 'error'
    baseResult.isError = true
    baseResult.isSuccess = false
  } else if (overrides.data !== undefined || overrides.isSuccess) {
    baseResult.status = 'success'
    baseResult.isSuccess = true
    baseResult.isError = false
    baseResult.isFetched = true
  }

  return baseResult as UseQueryResult<T, Error>
}

// Mock UseMutationResult factory function
export const createMockUseMutationResult = <TData = any, TError = Error, TVariables = void, TContext = unknown>(
  overrides: Partial<UseMutationResult<TData, TError, TVariables, TContext>> = {}
): UseMutationResult<TData, TError, TVariables, TContext> => {
  const baseResult = {
    data: undefined,
    error: null,
    variables: undefined,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    status: 'idle' as const,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    context: undefined,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    submittedAt: 0,
    ...overrides
  }

  // Adjust status and boolean flags based on the state
  if (overrides.isPending) {
    baseResult.status = 'pending'
    baseResult.isPending = true
    baseResult.isIdle = false
  } else if (overrides.error || overrides.isError) {
    baseResult.status = 'error'
    baseResult.isError = true
    baseResult.isIdle = false
    baseResult.isSuccess = false
  } else if (overrides.data !== undefined || overrides.isSuccess) {
    baseResult.status = 'success'
    baseResult.isSuccess = true
    baseResult.isError = false
    baseResult.isIdle = false
  }

  return baseResult as UseMutationResult<TData, TError, TVariables, TContext>
}

// Template-specific mock data
export const mockTemplate = {
  id: '1',
  title: 'Agile Fundamentals',
  description: 'Introduction to Agile methodologies',
  duration_days: 2,
  default_location_id: 'loc1',
  default_instructor_id: 'inst1',
  created_at: '2023-01-01T00:00:00Z'
}

export const mockTemplates = [
  mockTemplate,
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

export const mockLocations = [
  { id: 'loc1', name: 'Conference Room A', address: '123 Main St', virtual_url: '' },
  { id: 'loc2', name: 'Virtual Room', address: '', virtual_url: 'https://zoom.com/room' }
]

export const mockInstructors = [
  { id: 'inst1', name: 'John Doe', bio: 'Agile coach with 10 years experience' },
  { id: 'inst2', name: 'Jane Smith', bio: 'Certified Scrum Master' }
]

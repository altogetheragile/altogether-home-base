
import { vi } from 'vitest'
import { UseQueryResult } from '@tanstack/react-query'

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
  overrides: Partial<import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext>> = {}
): import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext> => {
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

  return baseResult as import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext>
}

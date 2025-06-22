
// Clean, unified version of the test utilities

import React from 'react'
import {
  render as rtlRender,
  RenderOptions,
  screen,
  fireEvent,
  waitFor,
  renderHook,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi, expect } from 'vitest'
import { Toaster } from '@/components/ui/toaster'

// Mock user data for auth context (using global mock from setup.tsx)
const mockAuthContextValue = {
  user: {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'test@example.com'
  },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}

// Wrapper for providing context (removed AuthProvider since we use global mock)
interface WrapperProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

const createWrapper = ({ queryClient }: Omit<WrapperProps, 'children'> = {}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Unified custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
  }
) => {
  const { queryClient, ...renderOptions } = options || {}
  return rtlRender(ui, {
    wrapper: createWrapper({ queryClient }),
    ...renderOptions
  })
}

// Reliable loading and error state helpers
export const waitForLoadingToFinish = async () => {
  // Wait for loading spinner to disappear
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).toBeNull()
  })
}

export const expectLoadingState = () => {
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
}

export const expectErrorState = (message?: string) => {
  const errorElement = screen.getByTestId('error-message')
  expect(errorElement).toBeInTheDocument()
  if (message) {
    expect(errorElement).toHaveTextContent(message)
  }
}

// Factory for test query clients
export const createTestQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        ...options
      },
      mutations: {
        retry: false
      }
    }
  })
}

// Mock UseQueryResult factory function
export const createMockUseQueryResult = <T = any>(
  overrides: Partial<UseQueryResult<T, Error>> = {}
): UseQueryResult<T, Error> => {
  const defaultResult: UseQueryResult<T, Error> = {
    data: undefined as T,
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
    status: 'pending',
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides
  }

  // Adjust status and boolean flags based on the state
  if (overrides.isLoading || overrides.isPending) {
    defaultResult.status = 'pending'
    defaultResult.isPending = true
    defaultResult.isLoading = overrides.isLoading ?? false
  } else if (overrides.error) {
    defaultResult.status = 'error'
    defaultResult.isError = true
    defaultResult.isSuccess = false
  } else if (overrides.data !== undefined) {
    defaultResult.status = 'success'
    defaultResult.isSuccess = true
    defaultResult.isError = false
    defaultResult.isFetched = true
  }

  return defaultResult
}

// Mock UseMutationResult factory function
export const createMockUseMutationResult = <TData = any, TError = Error, TVariables = void, TContext = unknown>(
  overrides: Partial<import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext>> = {}
): import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext> => {
  const defaultResult: import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, TContext> = {
    data: undefined as TData,
    error: null,
    variables: undefined as TVariables,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    status: 'idle',
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    context: undefined as TContext,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    submittedAt: 0,
    ...overrides
  }

  // Adjust status and boolean flags based on the state
  if (overrides.isPending) {
    defaultResult.status = 'pending'
    defaultResult.isPending = true
    defaultResult.isIdle = false
  } else if (overrides.error || overrides.isError) {
    defaultResult.status = 'error'
    defaultResult.isError = true
    defaultResult.isIdle = false
    defaultResult.isSuccess = false
  } else if (overrides.data !== undefined || overrides.isSuccess) {
    defaultResult.status = 'success'
    defaultResult.isSuccess = true
    defaultResult.isError = false
    defaultResult.isIdle = false
  }

  return defaultResult
}

// Export everything you need from one place
export {
  screen,
  fireEvent,
  waitFor,
  renderHook
}
export { customRender as render, createWrapper, mockAuthContextValue }
export * from '@testing-library/react'


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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

// Export everything you need from one place
export {
  screen,
  fireEvent,
  waitFor,
  renderHook
}
export { customRender as render, createWrapper, mockAuthContextValue }
export * from '@testing-library/react'


import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

// Mock user data for auth context
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

// Custom wrapper component
interface WrapperProps {
  children: React.ReactNode
  queryClient?: QueryClient
  authValue?: any
}

const createWrapper = ({ queryClient, authValue }: Omit<WrapperProps, 'children'> = {}) => {
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
        <AuthProvider value={authValue || mockAuthContextValue}>
          {children}
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
    authValue?: any
  }
) => {
  const { queryClient, authValue, ...renderOptions } = options || {}
  
  return rtlRender(ui, {
    wrapper: createWrapper({ queryClient, authValue }),
    ...renderOptions
  })
}

// Test helpers
export const waitForLoadingToFinish = () => {
  return screen.queryByTestId('loading-spinner') === null
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

// Mock factory for creating test query clients
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

// Export everything
export { customRender as render, createWrapper, mockAuthContextValue }
export * from '@testing-library/react'

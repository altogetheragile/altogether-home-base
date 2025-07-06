import React from 'react'
import { render as rtlRender, renderHook as rtlRenderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { TestErrorBoundary } from './error-boundary-wrapper'
import { createMockAuthContext } from './auth-test-helpers'

// Enhanced test query client with better defaults
export const createEnhancedTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false
      },
      mutations: {
        retry: false
      }
    }
  })
}

// Universal context wrapper with error boundary
export const createUniversalWrapper = (options: {
  queryClient?: QueryClient
  router?: { initialEntries?: string[]; initialIndex?: number }
  auth?: any
  withErrorBoundary?: boolean
} = {}) => {
  const {
    queryClient = createEnhancedTestQueryClient(),
    router,
    auth = createMockAuthContext(),
    withErrorBoundary = true
  } = options

  return ({ children }: { children: React.ReactNode }) => {
    let content = (
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          {router ? (
            <MemoryRouter 
              initialEntries={router.initialEntries || ['/']}
              initialIndex={router.initialIndex || 0}
            >
              {children}
            </MemoryRouter>
          ) : (
            children
          )}
        </QueryClientProvider>
      </AuthContext.Provider>
    )

    if (withErrorBoundary) {
      content = (
        <TestErrorBoundary>
          {content}
        </TestErrorBoundary>
      )
    }

    return content
  }
}

// Enhanced render functions with error boundaries and proper context isolation
export const renderComponentWithContext = (
  ui: React.ReactElement,
  options: {
    queryClient?: QueryClient
    router?: { initialEntries?: string[]; initialIndex?: number }
    auth?: any
    withErrorBoundary?: boolean
  } = {}
) => {
  return rtlRender(ui, {
    wrapper: createUniversalWrapper(options)
  })
}

export const renderHookWithContext = <T,>(
  hook: () => T,
  options: {
    queryClient?: QueryClient
    auth?: any
    withErrorBoundary?: boolean
  } = {}
) => {
  return rtlRenderHook(hook, {
    wrapper: createUniversalWrapper(options)
  })
}

// Specialized renders for common scenarios
export const renderWithAuth = (ui: React.ReactElement, authOverrides = {}) => {
  return renderComponentWithContext(ui, {
    auth: createMockAuthContext({}, authOverrides)
  })
}

export const renderWithRouter = (ui: React.ReactElement, routerOptions = {}) => {
  return renderComponentWithContext(ui, {
    router: routerOptions
  })
}

export const renderWithFullContext = (ui: React.ReactElement, options = {}) => {
  return renderComponentWithContext(ui, {
    router: { initialEntries: ['/'] },
    ...options
  })
}

// Hook-specific enhanced renders
export const renderHookWithQuery = <T,>(hook: () => T) => {
  return renderHookWithContext(hook, {
    queryClient: createEnhancedTestQueryClient()
  })
}

export const renderHookWithAuth = <T,>(hook: () => T, authOverrides = {}) => {
  return renderHookWithContext(hook, {
    auth: createMockAuthContext({}, authOverrides),
    queryClient: createEnhancedTestQueryClient()
  })
}
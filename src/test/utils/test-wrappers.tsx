
import React from 'react'
import {
  render as rtlRender,
  RenderOptions,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

// Wrapper for providing context (removed AuthProvider since we use global mock)
interface WrapperProps {
  children: React.ReactNode
  queryClient?: QueryClient
  router?: {
    initialEntries?: string[]
    initialIndex?: number
  }
}

const createWrapper = ({ queryClient, router }: Omit<WrapperProps, 'children'> = {}) => {
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
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

// Router-aware wrapper for components that need router context
const createRouterWrapper = ({ queryClient, router }: Omit<WrapperProps, 'children'> = {}) => {
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
    <MemoryRouter 
      initialEntries={router?.initialEntries || ['/']}
      initialIndex={router?.initialIndex || 0}
    >
      <QueryClientProvider client={testQueryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

// Unified custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
    router?: {
      initialEntries?: string[]
      initialIndex?: number
    }
  }
) => {
  const { queryClient, router, ...renderOptions } = options || {}
  return rtlRender(ui, {
    wrapper: createWrapper({ queryClient, router }),
    ...renderOptions
  })
}

// Router-aware render function for components that need router context
const renderWithRouter = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
    router?: {
      initialEntries?: string[]
      initialIndex?: number
    }
  }
) => {
  const { queryClient, router, ...renderOptions } = options || {}
  return rtlRender(ui, {
    wrapper: createRouterWrapper({ queryClient, router }),
    ...renderOptions
  })
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

export { 
  customRender as render, 
  renderWithRouter,
  createWrapper,
  createRouterWrapper 
}

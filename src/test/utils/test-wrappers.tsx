
import React from 'react'
import {
  render as rtlRender,
  RenderOptions,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

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
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
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

export { customRender as render, createWrapper }

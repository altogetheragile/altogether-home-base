import React from 'react'
import { renderHook as rtlRenderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ✅ VERIFIED PATTERN 2: Hook Test with QueryClient Context
// Use this for hooks that need QueryClient (useQuery, useMutation hooks)
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })
}

export const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

export const renderHookWithQuery = <T,>(hook: () => T) => {
  const testQueryClient = createTestQueryClient()
  return rtlRenderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    )
  })
}
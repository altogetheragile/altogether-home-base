import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from './query-test-utils'

// ✅ VERIFIED PATTERN 3: Router Wrapper for Components with Navigation
// Use this for components that need router context (Link, useLocation, etc.)
export const RouterWrapper = ({ 
  children, 
  initialEntries = ['/'] 
}: { 
  children: React.ReactNode
  initialEntries?: string[]
}) => {
  const testQueryClient = createTestQueryClient()
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  )
}

export const renderWithRouter = (
  ui: React.ReactElement, 
  { initialEntries = ['/'] } = {}
) => {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <RouterWrapper initialEntries={initialEntries}>
        {children}
      </RouterWrapper>
    )
  })
}
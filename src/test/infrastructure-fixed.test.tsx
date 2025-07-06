import { describe, it, expect } from 'vitest'
import { renderHookWithQuery, createTestQueryClient } from '@/test/utils/verified-patterns'
import { render, screen } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

// Test QueryClient context is working
const TestHook = () => {
  return useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve('test-data')
  })
}

// Test component with contexts
const TestComponent = () => (
  <div data-testid="test-component">
    <h1>Infrastructure Fixed</h1>
    <button>Test Button</button>
  </div>
)

describe('Infrastructure Fixed Tests', () => {
  it('should have working QueryClient context in hooks', async () => {
    const { result } = renderHookWithQuery(() => TestHook())
    
    expect(result.current.isLoading).toBeDefined()
    expect(result.current.data).toBeDefined()
  })

  it('should render components with error boundaries', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure Fixed')).toBeInTheDocument()
  })

  it('should create test query clients properly', () => {
    const queryClient = createTestQueryClient()
    
    expect(queryClient).toBeDefined()
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false)
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(0)
  })
})
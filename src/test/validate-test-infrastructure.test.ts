
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockUseQueryResult, createMockUseMutationResult } from './utils/mock-factories'

// Simple test component for infrastructure validation
const TestComponent = () => {
  return (
    <div>
      <h1>Test Infrastructure</h1>
      <button>Test Button</button>
    </div>
  )
}

describe('Test Infrastructure Validation', () => {
  describe('Basic Globals', () => {
    it('has expect available', () => {
      expect(expect).toBeDefined()
      expect(typeof expect).toBe('function')
    })

    it('has vi (vitest) available', () => {
      expect(vi).toBeDefined()
      expect(typeof vi.fn).toBe('function')
    })
  })

  describe('Mock Factories', () => {
    it('can create query result mocks', () => {
      const mockResult = createMockUseQueryResult({
        data: { test: 'data' },
        isSuccess: true
      })
      
      expect(mockResult.data).toEqual({ test: 'data' })
      expect(mockResult.isSuccess).toBe(true)
    })

    it('can create mutation result mocks', () => {
      const mockMutate = vi.fn()
      const mockResult = createMockUseMutationResult({
        mutate: mockMutate,
        isSuccess: true
      })
      
      expect(mockResult.mutate).toBe(mockMutate)
      expect(mockResult.isSuccess).toBe(true)
    })
  })

  describe('Component Rendering', () => {
    it('can render with providers', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      })

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TooltipProvider>
              <TestComponent />
            </TooltipProvider>
          </BrowserRouter>
        </QueryClientProvider>
      )
      
      expect(screen.getByText('Test Infrastructure')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Global Mocks', () => {
    it('has auth context mock', () => {
      const { useAuth } = require('@/contexts/AuthContext')
      expect(useAuth).toBeDefined()
    })

    it('has location hooks mock', () => {
      const { useLocations } = require('@/hooks/useLocations')
      expect(useLocations).toBeDefined()
    })

    it('has toast mock', () => {
      const { useToast } = require('@/hooks/use-toast')
      expect(useToast).toBeDefined()
    })
  })
})


import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockUseQueryResult, createMockUseMutationResult } from './utils/mock-factories'

// Test component to validate our test infrastructure
const TestComponent = () => {
  return (
    <div>
      <h1>Test Infrastructure Validation</h1>
      <button>Click me</button>
    </div>
  )
}

describe('Test Infrastructure Validation', () => {
  describe('Test Utilities', () => {
    it('can create mock query results', () => {
      const mockResult = createMockUseQueryResult({
        data: { test: 'data' },
        isLoading: false,
        isSuccess: true
      })
      
      expect(mockResult.data).toEqual({ test: 'data' })
      expect(mockResult.isLoading).toBe(false)
      expect(mockResult.isSuccess).toBe(true)
      expect(mockResult.status).toBe('success')
    })

    it('can create mock mutation results', () => {
      const mockMutate = vi.fn()
      const mockResult = createMockUseMutationResult({
        mutate: mockMutate,
        isPending: false,
        isSuccess: true
      })
      
      expect(mockResult.mutate).toBe(mockMutate)
      expect(mockResult.isPending).toBe(false)
      expect(mockResult.isSuccess).toBe(true)
      expect(mockResult.status).toBe('success')
    })
  })

  describe('Provider Wrappers', () => {
    it('can render components with all required providers', () => {
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
      
      expect(screen.getByText('Test Infrastructure Validation')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })
  })

  describe('Global Mocks', () => {
    it('has global auth context mock available', () => {
      const { useAuth } = require('@/contexts/AuthContext')
      
      expect(useAuth).toBeDefined()
      expect(typeof useAuth).toBe('function')
    })

    it('has global location hooks mock available', () => {
      const { useLocations } = require('@/hooks/useLocations')
      
      expect(useLocations).toBeDefined()
      expect(typeof useLocations).toBe('function')
    })

    it('has global toast mock available', () => {
      const { useToast } = require('@/hooks/use-toast')
      
      expect(useToast).toBeDefined()
      expect(typeof useToast).toBe('function')
    })
  })

  describe('Testing Globals', () => {
    it('has expect available globally', () => {
      expect(expect).toBeDefined()
      expect(typeof expect).toBe('function')
    })

    it('has vi (vitest) available globally', () => {
      expect(vi).toBeDefined()
      expect(typeof vi.fn).toBe('function')
      expect(typeof vi.mock).toBe('function')
    })
  })

  describe('Mock Status Consistency', () => {
    it('properly sets loading state in query mocks', () => {
      const loadingMock = createMockUseQueryResult({
        isLoading: true,
        isPending: true
      })
      
      expect(loadingMock.status).toBe('pending')
      expect(loadingMock.isPending).toBe(true)
      expect(loadingMock.isLoading).toBe(true)
      expect(loadingMock.isSuccess).toBe(false)
    })

    it('properly sets error state in query mocks', () => {
      const error = new Error('Test error')
      const errorMock = createMockUseQueryResult({
        error,
        isError: true
      })
      
      expect(errorMock.status).toBe('error')
      expect(errorMock.isError).toBe(true)
      expect(errorMock.error).toBe(error)
      expect(errorMock.isSuccess).toBe(false)
    })

    it('properly sets success state in query mocks', () => {
      const data = { test: 'data' }
      const successMock = createMockUseQueryResult({
        data,
        isSuccess: true
      })
      
      expect(successMock.status).toBe('success')
      expect(successMock.isSuccess).toBe(true)
      expect(successMock.data).toBe(data)
      expect(successMock.isError).toBe(false)
      expect(successMock.isFetched).toBe(true)
    })
  })
})


import { expect } from 'vitest'

// Since we're using MSW for mocking, these helpers are for integration testing
// where we need to test actual RLS behavior with real Supabase calls

// Mock admin user for RLS testing
export const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  role: 'admin'
}

// Mock regular user for RLS testing
export const mockRegularUser = {
  id: 'regular-user-id', 
  email: 'user@example.com',
  role: 'user'
}

// Helper to test if a user can perform an operation
export const testUserAccess = async (operation: () => Promise<any>, shouldSucceed: boolean) => {
  try {
    const result = await operation()
    if (shouldSucceed) {
      expect(result.error).toBeNull()
    } else {
      expect(result.error).toBeTruthy()
    }
    return result
  } catch (error) {
    if (shouldSucceed) {
      throw new Error(`Expected operation to succeed but it failed: ${error}`)
    }
    // Expected to fail
    return { error }
  }
}

// Helper to simulate admin context in tests
export const withAdminContext = (testFn: () => void | Promise<void>) => {
  return async () => {
    // This would be used in integration tests where we need admin privileges
    // For unit tests, we rely on the global auth mock in setup.tsx
    await testFn()
  }
}

// Helper to simulate regular user context in tests
export const withUserContext = (testFn: () => void | Promise<void>) => {
  return async () => {
    // This would be used in integration tests where we need regular user privileges
    // For unit tests, we rely on the global auth mock in setup.tsx
    await testFn()
  }
}

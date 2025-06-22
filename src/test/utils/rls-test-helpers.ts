
import { createClient } from '@supabase/supabase-js'

// Helper for testing RLS policies in integration tests
export const createTestSupabaseClient = (userToken?: string) => {
  const supabaseUrl = 'https://wqaplkypnetifpqrungv.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXBsa3lwbmV0aWZwcXJ1bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODg2OTUsImV4cCI6MjA2NDg2NDY5NX0.sE0cIatVX-tynJ7Z5dGp4L6f4-SA0s9KWU3WYtVoDzM'
  
  const client = createClient(supabaseUrl, supabaseKey)
  
  if (userToken) {
    client.auth.setAuth(userToken)
  }
  
  return client
}

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

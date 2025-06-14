
export const mockUser = {
  id: '12345678-1234-1234-1234-123456789012',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
}

export const mockSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser
}

export const mockProfile = {
  id: mockUser.id,
  email: mockUser.email,
  full_name: 'Test User',
  role: 'user',
  created_at: new Date().toISOString()
}

// Enhanced user data for different scenarios
export const mockAdminUser = {
  ...mockUser,
  id: 'admin-user-id',
  email: 'admin@example.com',
  user_metadata: {
    full_name: 'Admin User'
  }
}

export const mockAdminProfile = {
  ...mockProfile,
  id: mockAdminUser.id,
  email: mockAdminUser.email,
  full_name: 'Admin User',
  role: 'admin'
}

// Factory functions
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
  id: overrides.id || `user-${Date.now()}`
})

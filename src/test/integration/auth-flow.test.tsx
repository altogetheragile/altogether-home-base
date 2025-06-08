
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import { server } from '../mocks/server'
import React from 'react'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockNavigate = vi.fn()
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete sign in flow with valid credentials', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'user-1' } })

    render(<Auth />)
    
    // Fill in sign in form
    const emailInput = screen.getByPlaceholder('Email')
    const passwordInput = screen.getByPlaceholder('Password')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit form
    const signInButton = screen.getByRole('button', { name: 'Sign In' })
    fireEvent.click(signInButton)
    
    // Verify sign in was called
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should complete sign up flow', async () => {
    mockSignUp.mockResolvedValue({ user: { id: 'new-user' } })

    render(<Auth />)
    
    // Switch to sign up mode
    const signUpTrigger = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signUpTrigger)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    })
    
    // Fill in sign up form
    const emailInput = screen.getByPlaceholder('Email')
    const passwordInput = screen.getByPlaceholder('Password')
    
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    
    // Submit form
    const signUpButton = screen.getByRole('button', { name: 'Sign Up' })
    fireEvent.click(signUpButton)
    
    // Verify sign up was called
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123')
    })
  })
})

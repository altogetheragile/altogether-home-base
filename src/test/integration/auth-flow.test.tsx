
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
  const actual = (await importOriginal()) as any
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
    // Return proper format that matches AuthContext expectations
    mockSignIn.mockResolvedValue({ error: null })
    mockSignUp.mockResolvedValue({ error: null })
  })

  it('should complete sign in flow with valid credentials', async () => {
    render(<Auth />)
    
    // Fill in sign in form using test IDs
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit form
    const signInButton = screen.getByTestId('signin-submit-button')
    fireEvent.click(signInButton)
    
    // Verify sign in was called
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should complete sign up flow', async () => {
    render(<Auth />)
    
    // Switch to sign up mode
    const signUpTrigger = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signUpTrigger)
    
    // Use findBy* to wait for the signup form to render
    console.log('Waiting for signup form to render...')
    const signUpButton = await screen.findByTestId('signup-submit-button')
    expect(signUpButton).toBeInTheDocument()
    
    // Fill in sign up form using test IDs - wait for each field to be available
    const emailInput = await screen.findByTestId('email-signup-input')
    const passwordInput = await screen.findByTestId('password-signup-input')
    const fullNameInput = await screen.findByTestId('fullname-input')
    
    fireEvent.change(fullNameInput, { target: { value: 'New User' } })
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    
    // Submit form
    fireEvent.click(signUpButton)
    
    // Verify sign up was called
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123', 'New User')
    })
  })
})

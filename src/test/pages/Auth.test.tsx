
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import React from 'react'
import { act } from '@testing-library/react'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockNavigate = vi.fn()

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

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Return proper format that matches AuthContext expectations
    mockSignIn.mockResolvedValue({ error: null })
    mockSignUp.mockResolvedValue({ error: null })
  })

  it('should render sign in form by default', () => {
    render(<Auth />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByTestId('signin-submit-button')).toBeInTheDocument()
  })

  it('should toggle to sign up mode', async () => {
    render(<Auth />)
    
    // Debug initial state
    console.log('🧪 Auth Test: Initial render - looking for sign in button')
    expect(screen.getByTestId('signin-submit-button')).toBeInTheDocument()
    
    const signUpTrigger = screen.getByRole('tab', { name: 'Sign Up' })
    
    // Use act to ensure React finishes all updates
    await act(async () => {
      fireEvent.click(signUpTrigger)
    })
    
    console.log('🧪 Auth Test: After clicking sign up tab - waiting for sign up button')
    
    // Multiple wait strategies for reliability
    let signUpButton
    try {
      // Strategy 1: findBy with extended timeout
      signUpButton = await screen.findByTestId('signup-submit-button', {}, { timeout: 5000 })
    } catch (error) {
      console.log('🧪 Auth Test: findBy failed, trying waitFor approach')
      // Strategy 2: waitFor with aggressive timeout
      await waitFor(() => {
        signUpButton = screen.getByTestId('signup-submit-button')
        expect(signUpButton).toBeInTheDocument()
      }, { timeout: 5000, interval: 100 })
    }
    
    expect(signUpButton).toBeInTheDocument()
    
    // Verify the form fields are present in sign up mode
    expect(screen.getByTestId('fullname-input')).toBeInTheDocument()
    expect(screen.getByTestId('email-signup-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-signup-input')).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    render(<Auth />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('signin-submit-button')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import React from 'react'

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
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign in form by default', () => {
    render(<Auth />)
    
    expect(screen.getByPlaceholder('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholder('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should toggle to sign up mode', async () => {
    render(<Auth />)
    
    const signUpTrigger = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signUpTrigger)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    })
  })

  it('should handle form submission', async () => {
    render(<Auth />)
    
    const emailInput = screen.getByPlaceholder('Email')
    const passwordInput = screen.getByPlaceholder('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})

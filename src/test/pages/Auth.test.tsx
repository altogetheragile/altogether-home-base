
import { describe, it, expect, vi } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import React from 'react'

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn()
  })
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: null })
}))

describe('Auth Page', () => {
  it('should render sign in form by default', () => {
    render(<Auth />)
    
    expect(screen.getByPlaceholder('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholder('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should toggle to sign up mode', async () => {
    render(<Auth />)
    
    const signUpLink = screen.getByText('Sign up')
    fireEvent.click(signUpLink)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    })
  })

  it('should handle form submission', async () => {
    const mockSignIn = vi.fn()
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: vi.fn()
    })

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

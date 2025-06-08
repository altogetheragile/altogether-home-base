
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import { server } from '../mocks/server'
import React from 'react'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null })
}))

describe('Authentication Flow Integration', () => {
  it('should complete sign in flow with valid credentials', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
    
    vi.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: vi.fn()
      })
    }))

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
    const mockSignUp = vi.fn().mockResolvedValue({ user: { id: 'new-user' } })
    
    vi.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: mockSignUp
      })
    }))

    render(<Auth />)
    
    // Switch to sign up mode
    const signUpLink = screen.getByText('Sign up')
    fireEvent.click(signUpLink)
    
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

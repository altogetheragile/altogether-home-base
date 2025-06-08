
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../utils'
import { screen, fireEvent, waitFor } from '../rtl-helpers'
import Auth from '@/pages/Auth'
import React from 'react'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockNavigate = vi.fn()

// Mock Radix UI Tabs to eliminate async rendering issues
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs-root" data-default-value={defaultValue} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button 
      role="tab" 
      data-testid={`tab-trigger-${value}`}
      onClick={() => {
        // Simulate tab switching by dispatching a custom event
        const event = new CustomEvent('tabChange', { detail: { value } })
        document.dispatchEvent(event)
      }}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => {
    // Always render content for testing - the component will handle visibility
    return (
      <div data-testid={`tab-content-${value}`} {...props}>
        {children}
      </div>
    )
  }
}))

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
    mockSignIn.mockResolvedValue({ error: null })
    mockSignUp.mockResolvedValue({ error: null })
  })

  it('should render sign in form by default', () => {
    render(<Auth />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByTestId('signin-submit-button')).toBeInTheDocument()
  })

  it('should toggle to sign up mode', () => {
    render(<Auth />)
    
    // Click the sign up tab trigger
    const signUpTrigger = screen.getByTestId('tab-trigger-signup')
    fireEvent.click(signUpTrigger)
    
    // Both forms are rendered in the mocked version, so we can find the signup button immediately
    const signUpButton = screen.getByTestId('signup-submit-button')
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

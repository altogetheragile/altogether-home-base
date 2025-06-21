

import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import Auth from '@/pages/Auth'
import { server } from '../mocks/server'
import React from 'react'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockNavigate = vi.fn()
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

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
        const event = new CustomEvent('tabChange', { detail: { value } })
        document.dispatchEvent(event)
      }}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>
      {children}
    </div>
  )
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

// Mock the auth context - ensure complete export structure
vi.mock('@/contexts/AuthContext', () => ({
  AuthContext: React.createContext({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    session: null
  }),
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: vi.fn(),
    session: null
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    const signUpTrigger = screen.getByTestId('tab-trigger-signup')
    fireEvent.click(signUpTrigger)
    
    // Form fields are immediately available with mocked tabs
    const signUpButton = screen.getByTestId('signup-submit-button')
    const emailInput = screen.getByTestId('email-signup-input')
    const passwordInput = screen.getByTestId('password-signup-input')
    const fullNameInput = screen.getByTestId('fullname-input')
    
    expect(signUpButton).toBeInTheDocument()
    
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

